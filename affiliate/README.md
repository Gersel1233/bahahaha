# FYON Affiliate / Partner Program — drop-in package

A **working, tracked** referral program for FYON: referral links + coupon codes,
recurring commissions credited from real Stripe payments, tiered rates, a
partner dashboard, and Stripe Connect Express payouts.

Built for your stack: **Supabase + Stripe + FastAPI + Next.js 14**.
All money is in integer **cents**.

```
affiliate/
├── supabase/003_affiliate.sql        # schema + tiers + leaderboard view + RLS
├── backend/fyon_affiliate.py         # FastAPI router: attribution, webhook, payouts, dashboard
└── frontend/app/
    ├── r/[code]/route.ts             # referral link -> cookie + click log + redirect
    └── partner/page.tsx              # the partner dashboard (FYON-styled)
```

## How attribution works (the "detected" part)
1. Partner shares `fyon.com/r/CODE` **or** their coupon `CODE` (20% off).
2. `/r/[code]` drops a 60-day `fyon_ref` cookie + logs the click.
3. At Stripe Checkout you pass the cookie as **`client_reference_id`** AND/OR the
   customer applies the **promotion code** → either path attributes the customer.
4. Stripe **webhook** is the source of truth: every `invoice.payment_succeeded`
   from a referred customer → a commission row (`rate × amount`), `pending`.
5. After a **30-day hold** (refund safety) it becomes `available` to withdraw.
   `charge.refunded` auto-reverses the commission. Recurring renewals keep paying.

## Setup (≈30 min)

### 1. Database
Run `supabase/003_affiliate.sql` in the Supabase SQL editor.

### 2. Backend
- Copy `backend/fyon_affiliate.py` → `app/fyon_affiliate.py`.
- In `app/main.py`:
  ```python
  from app.fyon_affiliate import affiliate_router
  app.include_router(affiliate_router)
  ```
- `pip install stripe` (supabase already installed).
- **Replace `current_user_id()`** with your real auth (it reads `x-fyon-user` for now).

### 3. Stripe
- Create one **Coupon** (e.g. 20% off, "forever") → put its id in `FYON_AFFILIATE_COUPON_ID`.
- Enable **Connect** (Express) in your Stripe dashboard.
- Add a **webhook** → URL `https://<your-api>/affiliate/webhook`, events:
  `checkout.session.completed`, `invoice.payment_succeeded`, `charge.refunded`, `account.updated`.
  Put its signing secret in `STRIPE_WEBHOOK_SECRET`.
- In your existing **Checkout Session** creation, add:
  ```python
  client_reference_id = ref_code_from_cookie   # ties link-referrals to the sale
  allow_promotion_codes = True                 # lets the coupon code attribute too
  ```

### 4. Frontend
- Copy `frontend/app/r/[code]/route.ts` and `frontend/app/partner/page.tsx` into `fyon-web/app/`.
- At **signup**, read the `fyon_ref` cookie and:
  ```ts
  await fetch(`${API}/affiliate/attribute`, { method:"POST",
    headers:{...auth}, body: JSON.stringify({ code: refCookie }) });
  ```
- Set `NEXT_PUBLIC_API_URL`. Replace `authHeaders()` with your real session.

### 5. `.env`
```
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
FYON_AFFILIATE_COUPON_ID=...
FYON_PUBLIC_URL=https://www.fyon.com
FYON_PARTNER_RETURN_URL=https://www.fyon.com/partner
REFERRAL_IP_SALT=<random>
PAYOUT_HOLD_DAYS=30
# SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY already set
```

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| POST | `/affiliate/enroll` | become a partner (code + Stripe promo code) |
| GET  | `/affiliate/me` | dashboard data (balances, tier, referrals) |
| POST | `/affiliate/track` | log a referral click (called by `/r/[code]`) |
| POST | `/affiliate/attribute` | bind a signed-up user to a partner |
| POST | `/affiliate/connect-stripe` | Connect Express onboarding link |
| POST | `/affiliate/payout` | withdraw available balance ($10 min) |
| POST | `/affiliate/settings` | leaderboard / hide-name toggles |
| GET  | `/affiliate/leaderboard` | top 10 this month |
| POST | `/affiliate/webhook` | **Stripe webhook (source of truth)** |

## Tier ladder (edit in the SQL `affiliate_tiers` table)
Starter 15% · Bronze 17% ($100) · Silver 18% ($250) · Gold 20% ($500) ·
Platinum 22% ($1k) · Diamond 24% ($2.5k) · Elite 26% ($5k) · Champion 28% ($10k) · Legend 30% ($25k)

## Built-in safety
- **Idempotent** webhook (dedup on event id + unique invoice id) — no double-pay.
- **Refund hold** + auto-reversal on `charge.refunded`.
- **Self-referral** blocked; **first-touch** attribution (one partner per user).
- IPs are **hashed**, never stored raw. Service-role-only DB access (RLS on).

## Notes / next
- Wire `current_user_id()` + `authHeaders()` to your real auth before launch.
- Consider a fraud review for large/odd payouts, and a T&C checkbox at enroll.
- Tax: Stripe Connect handles payout rails, not 1099s — check your obligations.
