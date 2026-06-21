// Supabase Edge Function: stripe-webhook  (source of truth for commissions)
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Events:  checkout.session.completed, invoice.paid, invoice.payment_succeeded,
//          charge.refunded, account.updated
// Secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PAYOUT_HOLD_DAYS

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const WH = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const HOLD = Number(Deno.env.get("PAYOUT_HOLD_DAYS") ?? "30");

const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

const TIERS: [string, number, number][] = [
  ["Starter",15,0],["Bronze",17,10000],["Silver",18,25000],["Gold",20,50000],
  ["Platinum",22,100000],["Diamond",24,250000],["Elite",26,500000],["Champion",28,1000000],["Legend",30,2500000],
];

async function rateFor(partnerId: string) {
  const { data } = await sb.from("commissions").select("gross_cents,status").eq("partner_id", partnerId);
  const rev = (data ?? []).filter((c) => c.status !== "reversed").reduce((s, c) => s + c.gross_cents, 0);
  let rate = 15; for (const [, r, th] of TIERS) if (rev >= th) rate = r;
  return rate;
}
async function partnerByCode(code: string) {
  const { data } = await sb.from("partners").select("id").eq("code", String(code).toUpperCase()).maybeSingle();
  return data;
}
async function referralByCustomer(cust: string) {
  const { data } = await sb.from("referrals").select("*").eq("stripe_customer_id", cust).maybeSingle();
  return data;
}
async function ensureReferral(partner_id: string, cust: string, referred_user_id: string | null) {
  const ex = await sb.from("referrals").select("id").eq("stripe_customer_id", cust).maybeSingle();
  if (ex.data) return ex.data;
  const ins = await sb.from("referrals").insert({
    partner_id, stripe_customer_id: cust, referred_user_id, attributed_via: "link", status: "active",
  }).select().maybeSingle();
  return ins.data;
}
// Create the commission, OR update an existing row for the same invoice when it
// is missing a charge id (so we never insert a duplicate and always backfill the
// charge once it's known). Returns the row id + what happened (for logging).
async function credit(partner_id: string, referral_id: string | null, o: { invoice_id: string; charge_id?: string | null; amount: number; kind: "first" | "recurring"; currency?: string | null }): Promise<{ id: string | null; action: string }> {
  const rate = await rateFor(partner_id);
  const currency = (o.currency || "usd").toLowerCase();

  const existing = await sb.from("commissions").select("id,stripe_charge_id,currency").eq("stripe_invoice_id", o.invoice_id).maybeSingle();
  if (existing.data) {
    const patch: Record<string, unknown> = {};
    if (o.charge_id && !existing.data.stripe_charge_id) patch.stripe_charge_id = o.charge_id;
    if (o.currency && (existing.data.currency || "").toLowerCase() !== currency) patch.currency = currency;
    if (Object.keys(patch).length) {
      await sb.from("commissions").update(patch).eq("id", existing.data.id);
      return { id: existing.data.id, action: "updated:" + Object.keys(patch).join("+") };
    }
    return { id: existing.data.id, action: "exists" };
  }

  const ins = await sb.from("commissions").insert({
    partner_id, referral_id, stripe_invoice_id: o.invoice_id, stripe_charge_id: o.charge_id ?? null,
    gross_cents: o.amount, rate, commission_cents: Math.round(o.amount * rate / 100), currency,
    kind: o.kind, status: "pending", available_at: new Date(Date.now() + HOLD * 864e5).toISOString(),
  }).select("id").maybeSingle();
  if (ins.error) {
    // unique(stripe_invoice_id) race — fetch the row and patch its charge if missing
    const ex2 = await sb.from("commissions").select("id,stripe_charge_id").eq("stripe_invoice_id", o.invoice_id).maybeSingle();
    if (ex2.data && o.charge_id && !ex2.data.stripe_charge_id) await sb.from("commissions").update({ stripe_charge_id: o.charge_id, currency }).eq("id", ex2.data.id);
    return { id: ex2.data?.id ?? null, action: "race" };
  }
  return { id: ins.data?.id ?? null, action: "inserted" };
}
// referral_code can live in many places on an invoice depending on API version
function codeFromInvoice(o: any): string | null {
  return o?.metadata?.referral_code
    || o?.subscription_details?.metadata?.referral_code
    || o?.parent?.subscription_details?.metadata?.referral_code
    || o?.lines?.data?.[0]?.metadata?.referral_code
    || null;
}
// Settlement currency of a charge = balance_transaction.currency (what
// source_transaction transfers must match), falling back to charge.currency.
async function chargeCurrency(chargeId: string): Promise<string | null> {
  try {
    const ch: any = await stripe.charges.retrieve(chargeId, { expand: ["balance_transaction"] });
    const bt = ch?.balance_transaction;
    return ((bt && typeof bt === "object") ? bt.currency : null) || ch?.currency || null;
  } catch (e) {
    console.warn("[stripe-webhook] chargeCurrency failed", chargeId, (e as Error)?.message);
    return null;
  }
}

// Resolve {chargeId, currency, piId} from an invoice id — retrieve it FRESH with
// expands (the SDK is pinned to an API version that still exposes charge/
// payment_intent), so we get a real ch_... even when the webhook event object
// omitted it. Currency prefers balance_transaction (settlement) then invoice.
async function resolveFromInvoice(invoiceId: string): Promise<{ chargeId: string | null; currency: string | null; piId: string | null }> {
  let chargeId: string | null = null, currency: string | null = null, piId: string | null = null;
  try {
    const inv: any = await stripe.invoices.retrieve(invoiceId, {
      expand: ["charge.balance_transaction", "payment_intent.latest_charge.balance_transaction"],
    });
    const ch = inv.charge;
    if (ch && typeof ch === "object" && ch.id) { chargeId = ch.id; currency = ch.balance_transaction?.currency || ch.currency || null; }
    else if (typeof ch === "string" && ch.startsWith("ch_")) chargeId = ch;

    const pi = inv.payment_intent;
    piId = typeof pi === "string" ? pi : (pi?.id ?? null);
    if (!chargeId && pi && typeof pi === "object") {
      const lc = pi.latest_charge;
      if (lc && typeof lc === "object" && lc.id) { chargeId = lc.id; currency = currency || lc.balance_transaction?.currency || lc.currency || null; }
      else if (typeof lc === "string" && lc.startsWith("ch_")) chargeId = lc;
    }
    if (chargeId && !currency) currency = await chargeCurrency(chargeId);
    currency = currency || inv.currency || null;
  } catch (e) {
    console.warn("[stripe-webhook] resolveFromInvoice failed", invoiceId, (e as Error)?.message);
  }
  return { chargeId, currency, piId };
}

// Resolve {chargeId, currency} from a payment_intent id (one-time checkout, no invoice).
async function resolveFromPI(piId: string): Promise<{ chargeId: string | null; currency: string | null }> {
  try {
    const pi: any = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge.balance_transaction"] });
    const lc = pi.latest_charge;
    if (lc && typeof lc === "object" && lc.id) return { chargeId: lc.id, currency: lc.balance_transaction?.currency || lc.currency || pi.currency || null };
    if (typeof lc === "string" && lc.startsWith("ch_")) return { chargeId: lc, currency: await chargeCurrency(lc) };
  } catch (e) {
    console.warn("[stripe-webhook] resolveFromPI failed", piId, (e as Error)?.message);
  }
  return { chargeId: null, currency: null };
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(body, sig, WH, undefined, cryptoProvider); }
  catch (e) { return json({ ok: false, error: "bad signature: " + (e as Error).message }, 400); }

  // idempotency
  const dup = await sb.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup.error) return json({ ok: true, duplicate: true, handled: event.type });

  const o = event.data.object as any;
  let referral_code: string | null = null;
  let partner_found = false;
  let note = "";

  try {
    if (event.type === "checkout.session.completed") {
      referral_code = o.metadata?.referral_code || o.client_reference_id || null;
      const cust = o.customer;
      if (!referral_code) { note = "no referral_code on checkout.session"; }
      else {
        const p = await partnerByCode(referral_code);
        partner_found = !!p;
        if (!p) note = "no partner for code " + referral_code;
        else if (!cust) note = "no customer on session";
        else {
          const ref = await ensureReferral(p.id, cust, o.client_reference_id || null);
          const amount = Number(o.amount_total ?? 0);
          const piId = typeof o.payment_intent === "string" ? o.payment_intent : (o.payment_intent?.id ?? null);
          console.log("[stripe-webhook] checkout.session.completed", JSON.stringify({ session: o.id, invoice: o.invoice ?? null, payment_intent: piId, amount }));
          if (amount <= 0) {
            note = "referral created; amount_total is 0 (trial/free) — commission waits for first paid invoice";
          } else if (o.invoice) {
            // subscription checkout: invoice.paid will create the commission (with a real charge)
            note = "referral ready; subscription checkout — commission handled by invoice.paid";
          } else if (piId) {
            // one-time payment (no invoice): resolve the real charge now and credit
            const r = await resolveFromPI(piId);
            console.log("[stripe-webhook] checkout resolved", JSON.stringify({ payment_intent: piId, charge: r.chargeId, currency: r.currency }));
            const res = await credit(p.id, ref?.id ?? null, { invoice_id: "cs_" + o.id, charge_id: r.chargeId, amount, kind: "first", currency: r.currency || o.currency });
            console.log("[stripe-webhook] commission", JSON.stringify({ source: "checkout", commission_id: res.id, action: res.action, charge: r.chargeId }));
            note = `checkout commission ${res.action} (charge ${r.chargeId ?? "none"})`;
          } else {
            note = "referral created; no invoice or payment_intent on session — commission deferred";
          }
        }
      }
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const cust = o.customer; const amount = Number(o.amount_paid ?? 0);
      referral_code = codeFromInvoice(o);
      let ref = cust ? await referralByCustomer(cust) : null;
      if (!ref && referral_code && cust) {
        const p = await partnerByCode(referral_code);
        if (p) ref = await ensureReferral(p.id, cust, null);
      }
      partner_found = !!ref;
      console.log("[stripe-webhook] invoice.paid", JSON.stringify({ invoice: o.id, customer: cust, amount, billing_reason: o.billing_reason }));
      if (!ref) note = "no referral for customer (no code found on invoice)";
      else if (amount <= 0) note = "amount_paid is 0 (trial) — no commission yet";
      else {
        const r = await resolveFromInvoice(o.id);
        console.log("[stripe-webhook] invoice resolved", JSON.stringify({ invoice: o.id, payment_intent: r.piId, charge: r.chargeId, currency: r.currency }));
        if (!r.chargeId) console.warn("[stripe-webhook] invoice without resolvable charge — commission not payout-ready", o.id);
        const res = await credit(ref.partner_id, ref.id, { invoice_id: o.id, charge_id: r.chargeId, amount, kind: o.billing_reason === "subscription_create" ? "first" : "recurring", currency: r.currency || o.currency });
        console.log("[stripe-webhook] commission", JSON.stringify({ source: "invoice", invoice: o.id, commission_id: res.id, action: res.action, charge: r.chargeId, currency: r.currency }));
        note = `commission ${res.action} (charge ${r.chargeId ?? "none"})`;
      }
    } else if (event.type === "charge.refunded" || event.type === "refund.created" || event.type === "charge.refund.updated") {
      // charge.refunded: o is the charge (o.id = charge). refund.created: o is the refund (o.charge).
      const chargeId: string | null = event.type === "charge.refunded" ? o.id : (o.charge ?? null);
      if (!chargeId) { note = "refund event without a charge id"; }
      else {
        const { data: comms } = await sb.from("commissions").select("*").eq("stripe_charge_id", chargeId);
        let reversed = 0, clawbacks = 0;
        for (const c of comms ?? []) {
          if (c.status === "paid") {
            // already paid out — NEVER auto-pull from the partner. Log a negative adjustment.
            await sb.from("commissions").update({ clawback_needed: true }).eq("id", c.id);
            await sb.from("commission_adjustments").insert({
              partner_id: c.partner_id, commission_id: c.id, amount_cents: -Math.abs(c.commission_cents),
              reason: "refund after payout (manual clawback)", stripe_charge_id: chargeId,
            });
            clawbacks++;
            console.warn("[stripe-webhook] CLAWBACK NEEDED: paid commission", c.id, "partner", c.partner_id, "charge", chargeId);
          } else if (c.status !== "reversed") {
            await sb.from("commissions").update({ status: "reversed" }).eq("id", c.id);
            reversed++;
          }
        }
        note = `refund on charge ${chargeId}: ${reversed} reversed, ${clawbacks} clawback(s) flagged`;
      }
    } else if (event.type === "account.updated") {
      await sb.from("partners").update({ payout_enabled: !!(o.charges_enabled && o.payouts_enabled) }).eq("stripe_account_id", o.id);
      note = "account synced";
    } else {
      note = "unhandled event";
    }
  } catch (e) {
    console.error("[stripe-webhook]", e);
    note = "error: " + (e as Error).message;
  }

  if (!referral_code) console.log("[stripe-webhook] no referral code for", event.type, "—", note);
  return json({ ok: true, handled: event.type, referral_code, partner_found, note });
});
