"""
FYON Affiliate / Partner Program — backend (FastAPI).

Drop this in as `app/fyon_affiliate.py` and wire it in `app/main.py`:

    from app.fyon_affiliate import affiliate_router
    app.include_router(affiliate_router)

Stack: FastAPI + supabase-py (service role) + Stripe (Connect Express).
Money is in integer CENTS everywhere.

ENV (.env):
    SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY      # you already have these
    STRIPE_SECRET_KEY                            # platform secret key (sk_live_/sk_test_)
    STRIPE_WEBHOOK_SECRET                        # from the webhook endpoint you create
    FYON_AFFILIATE_COUPON_ID                     # a Stripe Coupon (e.g. 20% off, forever) created once
    FYON_PUBLIC_URL          = https://www.fyon.com
    FYON_PARTNER_RETURN_URL  = https://www.fyon.com/partner          # Connect onboarding return
    REFERRAL_IP_SALT         = <random string>   # for hashing IPs
    PAYOUT_HOLD_DAYS         = 30                 # refund hold before commission is withdrawable

Idempotency, refund reversal, self-referral guards and tier rates are all here.
"""

from __future__ import annotations
import os, hmac, hashlib, secrets, string, datetime as dt
from typing import Optional

import stripe
from fastapi import APIRouter, Request, HTTPException, Body
from fastapi.responses import JSONResponse
from supabase import create_client, Client

# ---- clients -------------------------------------------------------------
_sb: Optional[Client] = None
def sb() -> Client:
    global _sb
    if _sb is None:
        _sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
    return _sb

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "")
WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
COUPON_ID      = os.environ.get("FYON_AFFILIATE_COUPON_ID", "")
PUBLIC_URL     = os.environ.get("FYON_PUBLIC_URL", "https://www.fyon.com")
RETURN_URL     = os.environ.get("FYON_PARTNER_RETURN_URL", PUBLIC_URL + "/partner")
IP_SALT        = os.environ.get("REFERRAL_IP_SALT", "change-me")
HOLD_DAYS      = int(os.environ.get("PAYOUT_HOLD_DAYS", "30"))

affiliate_router = APIRouter(prefix="/affiliate", tags=["affiliate"])

# ==========================================================================
# AUTH SHIM — replace with your real auth. Returns the current app user id.
# ==========================================================================
def current_user_id(request: Request) -> str:
    uid = request.headers.get("x-fyon-user")  # TODO: swap for your real session/JWT
    if not uid:
        raise HTTPException(401, "not authenticated")
    return uid

# ---- small helpers -------------------------------------------------------
def _code(n: int = 10) -> str:
    a = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(a) for _ in range(n))

def _hash_ip(ip: str) -> str:
    return hashlib.sha256((ip + IP_SALT).encode()).hexdigest()[:32]

def _tier_for(cents: int) -> dict:
    rows = sb().table("affiliate_tiers").select("*").lte("threshold_cents", cents)\
              .order("level", desc=True).limit(1).execute().data
    return rows[0] if rows else {"level": 1, "name": "Starter", "rate": 15.0, "threshold_cents": 0}

def _next_tier(level: int) -> Optional[dict]:
    rows = sb().table("affiliate_tiers").select("*").eq("level", level + 1).execute().data
    return rows[0] if rows else None

def _partner_by_user(uid: str) -> Optional[dict]:
    rows = sb().table("partners").select("*").eq("user_id", uid).limit(1).execute().data
    return rows[0] if rows else None

# ==========================================================================
# 1) ENROLL — turn a user into a partner (code + Stripe promotion code)
# ==========================================================================
@affiliate_router.post("/enroll")
def enroll(request: Request):
    uid = current_user_id(request)
    existing = _partner_by_user(uid)
    if existing:
        return {"partner": existing}

    code = _code()
    promo_id = None
    # Create a Stripe promotion code (20% OFF) on the shared coupon, named = code.
    if COUPON_ID:
        try:
            promo = stripe.PromotionCode.create(
                coupon=COUPON_ID, code=code,
                metadata={"fyon_partner_user": uid},
            )
            promo_id = promo.id
        except Exception as e:
            print("[affiliate] promo code create failed:", e)

    row = sb().table("partners").insert({
        "user_id": uid, "code": code, "coupon_code": code,
        "stripe_promo_code_id": promo_id,
    }).execute().data[0]
    return {"partner": row}

# ==========================================================================
# 2) ATTRIBUTION
#    a) click logging (called by the Next.js /r/[code] route)
#    b) bind a signed-up user to the partner from their referral cookie
# ==========================================================================
@affiliate_router.post("/track")
async def track_click(request: Request, body: dict = Body(...)):
    code = (body.get("code") or "").strip().upper()
    if not code:
        return {"ok": False}
    ip = (request.headers.get("x-forwarded-for", "") or "").split(",")[0].strip()
    sb().table("referral_clicks").insert({
        "code": code, "visitor_id": body.get("visitor_id"),
        "ip_hash": _hash_ip(ip) if ip else None,
        "user_agent": request.headers.get("user-agent"),
        "landing_path": body.get("landing_path"),
    }).execute()
    return {"ok": True}

@affiliate_router.post("/attribute")
def attribute(request: Request, body: dict = Body(...)):
    """Call right after a user signs up, with the ref code from their cookie."""
    referred_user_id = body.get("user_id") or current_user_id(request)
    code = (body.get("code") or "").strip().upper()
    if not code:
        return {"attributed": False}
    p = sb().table("partners").select("id,user_id").eq("code", code).limit(1).execute().data
    if not p:
        return {"attributed": False, "reason": "unknown_code"}
    partner = p[0]
    if partner["user_id"] == referred_user_id:      # self-referral guard
        return {"attributed": False, "reason": "self_referral"}
    # first-touch: ignore if this user is already attributed
    exists = sb().table("referrals").select("id").eq("referred_user_id", referred_user_id).execute().data
    if exists:
        return {"attributed": False, "reason": "already_attributed"}
    sb().table("referrals").insert({
        "partner_id": partner["id"], "referred_user_id": referred_user_id,
        "attributed_via": "link",
    }).execute()
    return {"attributed": True}

# ==========================================================================
# 3) STRIPE WEBHOOK — the source of truth for commissions
#    Point a Stripe webhook at POST /affiliate/webhook with these events:
#    checkout.session.completed, invoice.payment_succeeded, charge.refunded,
#    account.updated
# ==========================================================================
@affiliate_router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(400, f"bad signature: {e}")

    # idempotency — never process an event twice
    try:
        sb().table("stripe_events").insert({"id": event["id"], "type": event["type"]}).execute()
    except Exception:
        return {"ok": True, "duplicate": True}

    t = event["type"]
    obj = event["data"]["object"]

    if t == "checkout.session.completed":
        _bind_customer(obj)
    elif t == "invoice.payment_succeeded":
        _credit_commission(obj, event["id"])
    elif t == "charge.refunded":
        _reverse_commission(obj)
    elif t == "account.updated":
        _sync_account(obj)
    return {"ok": True}

def _bind_customer(session: dict):
    """Link the Stripe customer to a partner via promo code or referral cookie."""
    customer = session.get("customer")
    if not customer:
        return
    partner_id = None
    via = "coupon"
    # (a) promotion code used at checkout?
    promo = (session.get("total_details", {}).get("breakdown", {}) or {})
    pc_id = None
    disc = session.get("discounts") or []
    if disc and isinstance(disc, list):
        pc_id = disc[0].get("promotion_code")
    if pc_id:
        rows = sb().table("partners").select("id").eq("stripe_promo_code_id", pc_id).limit(1).execute().data
        if rows: partner_id = rows[0]["id"]
    # (b) referral code passed as client_reference_id (from the link cookie)
    if not partner_id and session.get("client_reference_id"):
        rows = sb().table("partners").select("id").eq("code", session["client_reference_id"].upper()).limit(1).execute().data
        if rows: partner_id = rows[0]["id"]; via = "link"
    if not partner_id:
        return
    # upsert the referral with the customer id (first touch preserved by unique idx)
    existing = sb().table("referrals").select("id").eq("stripe_customer_id", customer).execute().data
    if existing:
        return
    sb().table("referrals").insert({
        "partner_id": partner_id, "stripe_customer_id": customer,
        "referred_user_id": session.get("client_reference_id") or None,
        "attributed_via": via, "status": "active",
    }).execute()

def _find_referral_by_customer(customer: str) -> Optional[dict]:
    rows = sb().table("referrals").select("*").eq("stripe_customer_id", customer).limit(1).execute().data
    return rows[0] if rows else None

def _credit_commission(invoice: dict, event_id: str):
    customer = invoice.get("customer")
    amount = int(invoice.get("amount_paid", 0))      # cents
    if not customer or amount <= 0:
        return
    ref = _find_referral_by_customer(customer)
    if not ref:
        return  # not a referred customer — nothing to do
    # current tier rate for this partner (based on revenue so far)
    rev = sb().rpc("partner_revenue_cents", {"p_partner": ref["partner_id"]}).execute().data or 0
    tier = _tier_for(int(rev))
    rate = float(tier["rate"])
    commission = round(amount * rate / 100.0)
    kind = "first" if invoice.get("billing_reason") == "subscription_create" else "recurring"
    available = dt.datetime.utcnow() + dt.timedelta(days=HOLD_DAYS)
    try:
        sb().table("commissions").insert({
            "partner_id": ref["partner_id"], "referral_id": ref["id"],
            "stripe_invoice_id": invoice.get("id"),
            "stripe_charge_id": invoice.get("charge"),
            "gross_cents": amount, "rate": rate, "commission_cents": commission,
            "kind": kind, "status": "pending", "available_at": available.isoformat(),
        }).execute()
    except Exception as e:
        print("[affiliate] commission insert (likely duplicate invoice):", e)

def _reverse_commission(charge: dict):
    cid = charge.get("id")
    if not cid:
        return
    sb().table("commissions").update({"status": "reversed"}).eq("stripe_charge_id", cid).execute()

def _sync_account(account: dict):
    enabled = bool(account.get("charges_enabled") and account.get("payouts_enabled"))
    sb().table("partners").update({"payout_enabled": enabled}).eq("stripe_account_id", account.get("id")).execute()

# ==========================================================================
# 4) STRIPE CONNECT — onboarding + payout
# ==========================================================================
@affiliate_router.post("/connect-stripe")
def connect_stripe(request: Request):
    uid = current_user_id(request)
    p = _partner_by_user(uid)
    if not p:
        raise HTTPException(400, "not a partner")
    acct = p.get("stripe_account_id")
    if not acct:
        account = stripe.Account.create(type="express", metadata={"fyon_partner": p["id"]})
        acct = account.id
        sb().table("partners").update({"stripe_account_id": acct}).eq("id", p["id"]).execute()
    link = stripe.AccountLink.create(
        account=acct, type="account_onboarding",
        refresh_url=RETURN_URL + "?stripe=refresh",
        return_url=RETURN_URL + "?stripe=done",
    )
    return {"url": link.url}

def _available_cents(partner_id: str) -> int:
    # promote matured pending -> available, then sum available
    sb().table("commissions").update({"status": "available"})\
        .eq("partner_id", partner_id).eq("status", "pending")\
        .lte("available_at", dt.datetime.utcnow().isoformat()).execute()
    rows = sb().table("commissions").select("commission_cents")\
            .eq("partner_id", partner_id).eq("status", "available").execute().data
    return sum(r["commission_cents"] for r in rows)

@affiliate_router.post("/payout")
def payout(request: Request):
    uid = current_user_id(request)
    p = _partner_by_user(uid)
    if not p:
        raise HTTPException(400, "not a partner")
    if not p.get("payout_enabled") or not p.get("stripe_account_id"):
        raise HTTPException(400, "connect Stripe first")
    amount = _available_cents(p["id"])
    if amount < 1000:   # $10 minimum
        raise HTTPException(400, "minimum payout is $10.00")
    transfer = stripe.Transfer.create(
        amount=amount, currency="usd",
        destination=p["stripe_account_id"], metadata={"fyon_partner": p["id"]},
    )
    sb().table("payouts").insert({
        "partner_id": p["id"], "amount_cents": amount,
        "stripe_transfer_id": transfer.id, "status": "paid",
    }).execute()
    sb().table("commissions").update({"status": "paid"})\
        .eq("partner_id", p["id"]).eq("status", "available").execute()
    return {"paid_cents": amount}

# ==========================================================================
# 5) DASHBOARD DATA + settings + leaderboard
# ==========================================================================
@affiliate_router.get("/me")
def me(request: Request):
    uid = current_user_id(request)
    p = _partner_by_user(uid)
    if not p:
        return {"enrolled": False}
    pid = p["id"]
    comms = sb().table("commissions").select("commission_cents,gross_cents,status,kind,created_at")\
              .eq("partner_id", pid).execute().data
    def s(status): return sum(c["commission_cents"] for c in comms if c["status"] == status)
    available = _available_cents(pid)
    lifetime  = sum(c["commission_cents"] for c in comms if c["status"] != "reversed")
    month     = sum(c["commission_cents"] for c in comms
                    if c["status"] != "reversed" and c["created_at"][:7] == dt.datetime.utcnow().strftime("%Y-%m"))
    revenue   = sum(c["gross_cents"] for c in comms if c["status"] != "reversed")
    tier      = _tier_for(revenue)
    nxt       = _next_tier(tier["level"])
    referrals = sb().table("referrals").select("id,status").eq("partner_id", pid).execute().data
    active    = len([r for r in referrals if r["status"] == "active"])
    return {
        "enrolled": True,
        "code": p["code"], "coupon": p["coupon_code"],
        "link": f"{PUBLIC_URL}/r/{p['code']}",
        "payout_enabled": p["payout_enabled"],
        "show_on_leaderboard": p["show_on_leaderboard"], "hide_username": p["hide_username"],
        "tier": tier, "next_tier": nxt, "revenue_cents": revenue,
        "available_cents": available, "month_cents": month,
        "lifetime_cents": lifetime, "pending_cents": s("pending"),
        "referrals_total": len(referrals), "referrals_active": active,
    }

@affiliate_router.post("/settings")
def settings(request: Request, body: dict = Body(...)):
    uid = current_user_id(request)
    p = _partner_by_user(uid)
    if not p:
        raise HTTPException(400, "not a partner")
    patch = {k: v for k, v in body.items() if k in ("show_on_leaderboard", "hide_username", "display_name")}
    if patch:
        sb().table("partners").update(patch).eq("id", p["id"]).execute()
    return {"ok": True}

@affiliate_router.get("/leaderboard")
def leaderboard():
    rows = sb().table("leaderboard_monthly").select("*")\
            .eq("show_on_leaderboard", True).order("month_cents", desc=True).limit(10).execute().data
    return {"top": [{"name": r["name"], "month_cents": r["month_cents"]} for r in rows]}
