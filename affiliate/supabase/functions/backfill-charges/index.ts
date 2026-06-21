// Supabase Edge Function: backfill-charges
// One-off / safe-to-repeat backfill: fill commissions.stripe_charge_id (ch_...) for
// rows created before the webhook stored real charge ids. Sets payout_ready via the
// generated column automatically. NEVER writes a pi_..., only a resolved ch_....
//
// Deploy:  supabase functions deploy backfill-charges --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, and EITHER BACKFILL_SECRET (curl gate) OR ADMIN_EMAILS
//
// Run (dry-run first to preview, then for real):
//   curl -X POST "$SUPABASE_URL/functions/v1/backfill-charges?dry=1" -H "x-admin-key: $BACKFILL_SECRET"
//   curl -X POST "$SUPABASE_URL/functions/v1/backfill-charges"       -H "x-admin-key: $BACKFILL_SECRET"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sget(path: string, key: string) {
  const r = await fetch("https://api.stripe.com/v1/" + path, { headers: { "Authorization": "Bearer " + key } });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} failed (${r.status})`);
  return d;
}
const isCh = (s: unknown): s is string => typeof s === "string" && s.startsWith("ch_");
const chargeFromPI = async (pi: unknown, key: string): Promise<string | null> => {
  const id = typeof pi === "string" ? pi : (pi as any)?.id;
  if (!id || !String(id).startsWith("pi_")) return null;
  const p = await sget("payment_intents/" + id, key);
  const lc = p?.latest_charge;
  return isCh(lc) ? lc : (isCh(lc?.id) ? lc.id : null);
};

// Resolve a real charge id for one commission row, using every Stripe handle we have.
async function resolveCharge(c: any, key: string): Promise<{ charge: string | null; via: string }> {
  const inv: string = c.stripe_invoice_id ?? "";

  // 1) a real Stripe invoice (in_...)
  if (inv.startsWith("in_")) {
    try {
      const invoice = await sget("invoices/" + inv, key);
      if (isCh(invoice.charge)) return { charge: invoice.charge, via: "invoice.charge" };
      const ch = await chargeFromPI(invoice.payment_intent, key);
      if (ch) return { charge: ch, via: "invoice.payment_intent.latest_charge" };
    } catch (_) { /* fall through to customer fallback */ }
  }

  // 2) a checkout session (we stored "cs_" + session.id, so it may read "cs_cs_...")
  if (inv.startsWith("cs_")) {
    const sessionId = inv.startsWith("cs_cs_") ? inv.slice(3) : inv;
    try {
      const s = await sget("checkout/sessions/" + sessionId, key);
      const ch = await chargeFromPI(s.payment_intent, key);
      if (ch) return { charge: ch, via: "checkout_session.payment_intent.latest_charge" };
      if (typeof s.invoice === "string" && s.invoice.startsWith("in_")) {
        const invoice = await sget("invoices/" + s.invoice, key);
        if (isCh(invoice.charge)) return { charge: invoice.charge, via: "checkout_session.invoice.charge" };
        const ch2 = await chargeFromPI(invoice.payment_intent, key);
        if (ch2) return { charge: ch2, via: "checkout_session.invoice.payment_intent" };
      }
    } catch (_) { /* fall through */ }
  }

  // 3) fallback: match a charge on the referred customer by amount
  let cust: string | null = null;
  if (c.referral_id) {
    const { data: ref } = await sb.from("referrals").select("stripe_customer_id").eq("id", c.referral_id).maybeSingle();
    cust = ref?.stripe_customer_id ?? null;
  }
  if (cust) {
    try {
      const list = await sget(`charges?customer=${cust}&limit=100`, key);
      const cands = (list.data ?? []).filter((ch: any) => ch.paid && !ch.refunded && ch.amount === c.gross_cents);
      if (cands.length === 1) return { charge: cands[0].id, via: "customer.charge(amount match)" };
      if (cands.length > 1) return { charge: cands[0].id, via: "customer.charge(amount match, first of several)" };
    } catch (_) { /* give up */ }
  }
  return { charge: null, via: "unresolved" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    // gate: BACKFILL_SECRET header, OR admin JWT (ADMIN_EMAILS)
    const secret = Deno.env.get("BACKFILL_SECRET");
    if (secret) {
      const got = req.headers.get("x-admin-key") ?? new URL(req.url).searchParams.get("key");
      if (got !== secret) return json({ error: "forbidden" }, 403);
    } else {
      const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
      const { data: { user } } = await sb.auth.getUser(jwt);
      const admins = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
      if (!user || admins.length === 0 || !admins.includes((user.email ?? "").toLowerCase()))
        return json({ error: "forbidden (set BACKFILL_SECRET or ADMIN_EMAILS)" }, 403);
    }

    const dry = new URL(req.url).searchParams.get("dry") === "1";

    const { data: rows, error } = await sb.from("commissions")
      .select("id,stripe_invoice_id,referral_id,gross_cents,status")
      .is("stripe_charge_id", null);
    if (error) return json({ error: error.message }, 500);

    const report: Array<Record<string, unknown>> = [];
    let updated = 0;
    for (const c of rows ?? []) {
      const { charge, via } = await resolveCharge(c, key);
      if (charge) {
        if (!dry) await sb.from("commissions").update({ stripe_charge_id: charge }).eq("id", c.id);
        updated++;
        report.push({ commission_id: c.id, charge, via, applied: !dry });
      } else {
        report.push({ commission_id: c.id, charge: null, via, applied: false });
      }
    }

    return json({ ok: true, dry_run: dry, scanned: (rows ?? []).length, resolved: updated, report });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
