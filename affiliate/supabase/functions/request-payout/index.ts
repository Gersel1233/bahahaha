// Supabase Edge Function: request-payout
// Pays out a partner's AVAILABLE balance via a Stripe Connect transfer.
// Calls Stripe REST directly with fetch (no SDK -> no bundling timeout).
// Deploy:  supabase functions deploy request-payout --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, PAYOUT_HOLD_DAYS (default 30), MIN_PAYOUT_CENTS (default 1000)
//
// Safety:
//  - requires Supabase auth JWT + payout_enabled + stripe_account_id
//  - releases matured commissions first (pending -> available)
//  - claims available commissions atomically (UPDATE ... WHERE status='available')
//    so a double-click / concurrent run can never pay the same commission twice
//  - creates the Stripe transfer with an Idempotency-Key = payout id
//  - reverts the claim + marks the payout failed if the transfer errors

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const HOLD = Number(Deno.env.get("PAYOUT_HOLD_DAYS") ?? "30");
const MIN = Number(Deno.env.get("MIN_PAYOUT_CENTS") ?? "1000"); // $10.00

async function stripe(path: string, key: string, params: Record<string, string>, idemKey?: string) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.append(k, String(v));
  const headers: Record<string, string> = {
    "Authorization": "Bearer " + key,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  const r = await fetch("https://api.stripe.com/v1/" + path, { method: "POST", headers, body: body.toString() });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} failed (${r.status})`);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);

    const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
    if (!p) return json({ error: "not a partner" }, 400);
    if (!p.payout_enabled || !p.stripe_account_id) return json({ error: "Connect Stripe first" }, 400);

    // 1) mature any commissions past the hold window
    await sb.rpc("release_commissions", { hold_days: HOLD });

    // 2) gather this partner's available commissions
    const { data: avail } = await sb.from("commissions")
      .select("id,commission_cents,currency").eq("partner_id", p.id).eq("status", "available");
    const rows = avail ?? [];
    const ids = rows.map((c) => c.id);
    const total = rows.reduce((s, c) => s + (c.commission_cents || 0), 0);
    const currency = (rows[0]?.currency || "usd").toLowerCase();

    if (ids.length === 0 || total < MIN) {
      return json({ error: `Minimum payout is $${(MIN / 100).toFixed(0)}`, available_cents: total }, 400);
    }

    // 3) open a pending payout row (gives us a stable id for idempotency)
    const { data: payout, error: pe } = await sb.from("payouts")
      .insert({ partner_id: p.id, amount_cents: total, currency, status: "pending" }).select().single();
    if (pe || !payout) return json({ error: "could not open payout: " + (pe?.message ?? "unknown") }, 500);

    // 4) ATOMIC CLAIM — only rows still 'available' flip to 'paid' + get this payout_id.
    //    A concurrent/duplicate request claims 0 rows here -> we void it below.
    const { data: claimed } = await sb.from("commissions")
      .update({ status: "paid", payout_id: payout.id })
      .in("id", ids).eq("status", "available").select("commission_cents");
    const claimedRows = claimed ?? [];
    const claimedAmount = claimedRows.reduce((s, c) => s + (c.commission_cents || 0), 0);

    if (claimedRows.length === 0 || claimedAmount < MIN) {
      // nothing really claimed (double-click) — revert any partial claim & void payout
      await sb.from("commissions").update({ status: "available", payout_id: null })
        .eq("payout_id", payout.id).eq("status", "paid");
      await sb.from("payouts").update({ status: "failed", error_message: "no claimable balance (already processing?)" })
        .eq("id", payout.id);
      return json({ error: "No available balance to pay (already processing?)", available_cents: claimedAmount }, 409);
    }
    if (claimedAmount !== total) {
      await sb.from("payouts").update({ amount_cents: claimedAmount }).eq("id", payout.id);
    }

    // 5) create the transfer (idempotent by payout id)
    try {
      const transfer = await stripe("transfers", key, {
        "amount": String(claimedAmount),
        "currency": currency,
        "destination": p.stripe_account_id,
        "metadata[partner_id]": p.id,
        "metadata[payout_id]": payout.id,
      }, "payout_" + payout.id);

      await sb.from("payouts").update({
        status: "paid", paid_at: new Date().toISOString(), stripe_transfer_id: transfer.id,
      }).eq("id", payout.id);

      return json({ ok: true, amount_cents: claimedAmount, currency, transfer_id: transfer.id, payout_id: payout.id });
    } catch (e) {
      // transfer failed -> put the money back as available, mark payout failed
      await sb.from("commissions").update({ status: "available", payout_id: null }).eq("payout_id", payout.id);
      await sb.from("payouts").update({ status: "failed", error_message: String((e as Error)?.message ?? e) })
        .eq("id", payout.id);
      return json({ error: "Stripe transfer failed: " + String((e as Error)?.message ?? e) }, 502);
    }
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
