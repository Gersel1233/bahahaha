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
async function credit(partner_id: string, referral_id: string | null, o: { invoice_id: string; charge_id?: string | null; amount: number; kind: "first" | "recurring"; currency?: string | null }) {
  const rate = await rateFor(partner_id);
  const { error } = await sb.from("commissions").insert({
    partner_id, referral_id, stripe_invoice_id: o.invoice_id, stripe_charge_id: o.charge_id ?? null,
    gross_cents: o.amount, rate, commission_cents: Math.round(o.amount * rate / 100),
    currency: (o.currency || "usd").toLowerCase(),
    kind: o.kind, status: "pending", available_at: new Date(Date.now() + HOLD * 864e5).toISOString(),
  });
  return !error; // unique(stripe_invoice_id) -> false on duplicate (idempotent)
}
// referral_code can live in many places on an invoice depending on API version
function codeFromInvoice(o: any): string | null {
  return o?.metadata?.referral_code
    || o?.subscription_details?.metadata?.referral_code
    || o?.parent?.subscription_details?.metadata?.referral_code
    || o?.lines?.data?.[0]?.metadata?.referral_code
    || null;
}
// Resolve a REAL charge id (ch_...) AND its currency. Never store pi_... —
// payouts use source_transaction which requires a charge, and the transfer
// currency must match the charge currency. Resolves a payment_intent to its
// latest_charge when only the PI is present.
async function realChargeInfo(charge: any, paymentIntent: any): Promise<{ charge: string | null; currency: string | null }> {
  if (typeof charge === "string" && charge.startsWith("ch_")) return { charge, currency: null };
  if (charge && typeof charge === "object" && charge.id) return { charge: charge.id, currency: charge.currency ?? null };
  const piId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id;
  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      const lc: any = (pi as any).latest_charge;
      const ch = typeof lc === "string" ? lc : (lc?.id ?? null);
      if (ch && String(ch).startsWith("ch_")) {
        return { charge: ch, currency: (pi as any).currency ?? (typeof lc === "object" ? lc?.currency : null) ?? null };
      }
    } catch (e) {
      console.warn("[stripe-webhook] could not resolve charge from payment_intent", piId, (e as Error)?.message);
    }
  }
  return { charge: null, currency: null };
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
          if (amount > 0) {
            const ci = await realChargeInfo(null, o.payment_intent);
            if (!ci.charge) console.warn("[stripe-webhook] checkout without resolvable charge — commission not payout-ready", o.id);
            const ok = await credit(p.id, ref?.id ?? null, { invoice_id: o.invoice || ("cs_" + o.id), charge_id: ci.charge, amount, kind: "first", currency: ci.currency || o.currency });
            note = ok ? "referral + commission created" : "referral ok; commission already existed";
          } else note = "referral created; amount_total is 0 (trial/free) — commission waits for first paid invoice";
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
      if (!ref) note = "no referral for customer (no code found on invoice)";
      else if (amount <= 0) note = "amount_paid is 0 (trial) — no commission yet";
      else {
        const ci = await realChargeInfo(o.charge, o.payment_intent);
        if (!ci.charge) console.warn("[stripe-webhook] invoice without resolvable charge — commission not payout-ready", o.id);
        const ok = await credit(ref.partner_id, ref.id, { invoice_id: o.id, charge_id: ci.charge, amount, kind: o.billing_reason === "subscription_create" ? "first" : "recurring", currency: ci.currency || o.currency });
        note = ok ? "commission created" : "commission already existed (idempotent)";
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
