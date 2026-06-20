// Supabase Edge Function: stripe-webhook  (THE source of truth for commissions)
// Deploy:  supabase functions deploy stripe-webhook --no-verify-jwt
// Stripe webhook events: checkout.session.completed, invoice.paid,
//                        invoice.payment_succeeded, charge.refunded, account.updated
//
// Secrets (supabase secrets set ...):
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PAYOUT_HOLD_DAYS
//   (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are injected automatically)

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20",
});
const cryptoProvider = Stripe.createSubtleCryptoProvider();
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const WH = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const HOLD = Number(Deno.env.get("PAYOUT_HOLD_DAYS") ?? "30");

const TIERS: [string, number, number][] = [
  ["Starter",15,0],["Bronze",17,10000],["Silver",18,25000],["Gold",20,50000],
  ["Platinum",22,100000],["Diamond",24,250000],["Elite",26,500000],["Champion",28,1000000],["Legend",30,2500000],
];

async function rateFor(partnerId: string): Promise<number> {
  const { data } = await sb.from("commissions").select("gross_cents,status").eq("partner_id", partnerId);
  const rev = (data ?? []).filter((c) => c.status !== "reversed").reduce((s, c) => s + c.gross_cents, 0);
  let rate = 15; for (const [, r, th] of TIERS) if (rev >= th) rate = r;
  return rate;
}
async function partnerByCode(code: string) {
  const { data } = await sb.from("partners").select("id").eq("code", code.toUpperCase()).maybeSingle();
  return data;
}
async function referralByCustomer(cust: string) {
  const { data } = await sb.from("referrals").select("*").eq("stripe_customer_id", cust).maybeSingle();
  return data;
}
async function credit(partner_id: string, referral_id: string | null, opts: {
  invoice_id: string; charge_id?: string | null; amount: number; kind: "first" | "recurring";
}) {
  const rate = await rateFor(partner_id);
  await sb.from("commissions").insert({
    partner_id, referral_id, stripe_invoice_id: opts.invoice_id, stripe_charge_id: opts.charge_id ?? null,
    gross_cents: opts.amount, rate, commission_cents: Math.round(opts.amount * rate / 100),
    kind: opts.kind, status: "pending", available_at: new Date(Date.now() + HOLD * 864e5).toISOString(),
  }); // unique(stripe_invoice_id) makes this idempotent
}

Deno.serve(async (req) => {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try { event = await stripe.webhooks.constructEventAsync(body, sig, WH, undefined, cryptoProvider); }
  catch (e) { return new Response("bad signature: " + (e as Error).message, { status: 400 }); }

  // idempotency — never process an event twice
  const dup = await sb.from("stripe_events").insert({ id: event.id, type: event.type });
  if (dup.error) return new Response(JSON.stringify({ duplicate: true }), { status: 200 });

  const o = event.data.object as Record<string, unknown> as any;
  try {
    if (event.type === "checkout.session.completed") {
      const code = o.metadata?.referral_code || o.client_reference_id;
      const cust = o.customer;
      if (code && cust) {
        const p = await partnerByCode(String(code));
        if (p) {
          if (!(await referralByCustomer(cust))) {
            await sb.from("referrals").insert({
              partner_id: p.id, stripe_customer_id: cust,
              referred_user_id: o.client_reference_id || null, attributed_via: "link", status: "active",
            });
          }
          // one-time payment (no invoice) -> credit here using the session id
          if (o.mode === "payment" && (o.amount_total ?? 0) > 0) {
            const ref = await referralByCustomer(cust);
            await credit(p.id, ref?.id ?? null, { invoice_id: "cs_" + o.id, charge_id: o.payment_intent, amount: o.amount_total, kind: "first" });
          }
        }
      }
    } else if (event.type === "invoice.paid" || event.type === "invoice.payment_succeeded") {
      const cust = o.customer; const amount = o.amount_paid ?? 0;
      if (cust && amount > 0) {
        const ref = await referralByCustomer(cust);
        if (ref) await credit(ref.partner_id, ref.id, {
          invoice_id: o.id, charge_id: o.charge, amount,
          kind: o.billing_reason === "subscription_create" ? "first" : "recurring",
        });
      }
    } else if (event.type === "charge.refunded") {
      await sb.from("commissions").update({ status: "reversed" }).eq("stripe_charge_id", o.id);
    } else if (event.type === "account.updated") {
      await sb.from("partners").update({ payout_enabled: !!(o.charges_enabled && o.payouts_enabled) }).eq("stripe_account_id", o.id);
    }
  } catch (e) { console.error("[stripe-webhook]", e); }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
