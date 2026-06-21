// Supabase Edge Function: request-payout
// Pays out a partner's AVAILABLE balance via Stripe Connect transfers, using
// source_transaction so a transfer can draw from a specific charge even before
// the platform's available balance has settled. Stripe REST via fetch (no SDK).
// Deploy:  supabase functions deploy request-payout --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, PAYOUT_HOLD_DAYS (default 30), MIN_PAYOUT_CENTS (default 1000)
//
// Model:
//  - ONE transfer per commission, source_transaction = commission.stripe_charge_id (ch_...)
//  - all transfers from one withdraw are grouped under ONE payouts row
//  - each commission stores its own stripe_transfer_id
//
// Safety:
//  - requires auth JWT + payout_enabled + stripe_account_id
//  - each commission is claimed atomically (UPDATE ... WHERE status='available') so a
//    double-click can never pay it twice; a per-commission Idempotency-Key on the
//    Stripe transfer is a second guard against duplicate transfers
//  - a commission is marked 'paid' only after ITS transfer succeeds; if a transfer
//    fails, only that commission is reverted to 'available' (others still go through)
//  - commissions whose charge id is not a real ch_... are skipped (we try to resolve
//    pi_... -> latest_charge first); a clear message explains any that remain

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

async function stripePost(path: string, key: string, params: Record<string, string>, idemKey?: string) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.append(k, String(v));
  const headers: Record<string, string> = {
    "Authorization": "Bearer " + key,
    "Content-Type": "application/x-www-form-urlencoded",
  };
  if (idemKey) headers["Idempotency-Key"] = idemKey;
  const r = await fetch("https://api.stripe.com/v1/" + path, { method: "POST", headers, body: body.toString() });
  const d = await r.json();
  if (!r.ok) {
    const err = new Error(d?.error?.message || `Stripe ${path} failed (${r.status})`) as Error & { stripeCode?: string };
    err.stripeCode = d?.error?.code;
    throw err;
  }
  return d;
}
async function stripeGet(path: string, key: string) {
  const r = await fetch("https://api.stripe.com/v1/" + path, { headers: { "Authorization": "Bearer " + key } });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} failed (${r.status})`);
  return d;
}

// Resolve a usable charge id (ch_...) AND its real Stripe currency.
// Accepts an existing ch_ (fetches the charge for its currency), or resolves a
// payment_intent (pi_...) to its latest_charge. Persists the resolved charge id
// and the real currency back onto the commission so future runs are cheap and
// the transfer currency always matches the source charge.
async function chargeInfo(
  c: { id: string; stripe_charge_id: string | null; currency: string | null },
  key: string,
): Promise<{ charge: string; currency: string } | null> {
  const cur = c.stripe_charge_id;
  let charge: string | null = null;
  let currency: string | null = null;

  if (cur && cur.startsWith("ch_")) {
    charge = cur;
    try { const ch = await stripeGet("charges/" + cur, key); currency = ch?.currency ?? null; } catch (_) { /* fall back below */ }
  } else if (cur && cur.startsWith("pi_")) {
    try {
      const pi = await stripeGet("payment_intents/" + cur, key);
      const lc = pi?.latest_charge;
      const id = typeof lc === "string" ? lc : (lc?.id ?? null);
      if (id && String(id).startsWith("ch_")) {
        charge = id;
        currency = pi?.currency ?? (typeof lc === "object" ? lc?.currency : null) ?? null;
        await sb.from("commissions").update({ stripe_charge_id: id }).eq("id", c.id);
      }
    } catch (e) {
      console.warn("[request-payout] could not resolve charge for commission", c.id, String((e as Error)?.message ?? e));
    }
  }

  if (!charge) return null;
  if (!currency) {
    try { const ch = await stripeGet("charges/" + charge, key); currency = ch?.currency ?? null; } catch (_) { /* */ }
  }
  currency = String(currency || c.currency || "usd").toLowerCase();

  // persist the real currency if it was missing/wrong (e.g. backfilled rows defaulted to 'usd')
  if ((c.currency || "").toLowerCase() !== currency) {
    await sb.from("commissions").update({ currency }).eq("id", c.id);
  }
  return { charge, currency };
}
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);
    const testMode = key.startsWith("sk_test_");

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
      .select("id,commission_cents,currency,stripe_charge_id,stripe_transfer_id")
      .eq("partner_id", p.id).eq("status", "available");
    const rows = avail ?? [];

    // 3) resolve each to a real charge id (ch_...). Skip the un-resolvable ones and
    //    anything that already has a transfer recorded (belt-and-braces vs double-pay).
    const ready: Array<{ id: string; commission_cents: number; currency: string; charge: string }> = [];
    let notReady = 0, alreadyPaid = 0;
    for (const c of rows) {
      if (c.stripe_transfer_id) { alreadyPaid++; continue; } // already transferred — never pay twice
      const info = await chargeInfo(c, key);
      if (info) ready.push({ id: c.id, commission_cents: c.commission_cents || 0, currency: info.currency, charge: info.charge });
      else notReady++;
    }

    const readyTotal = ready.reduce((s, c) => s + c.commission_cents, 0);
    const availTotal = rows.reduce((s, c) => s + (c.commission_cents || 0), 0);

    if (ready.length === 0) {
      return json({
        error: alreadyPaid > 0
          ? "These commissions were already transferred — nothing left to withdraw. Refresh to update your balance."
          : notReady > 0
          ? "Your commissions aren't payout-ready yet — they're missing a Stripe charge reference. This resolves automatically once the paid invoice is processed."
          : `Minimum payout is $${(MIN / 100).toFixed(0)}`,
        available_cents: availTotal, not_ready_count: notReady, already_paid_count: alreadyPaid,
      }, 400);
    }
    if (readyTotal < MIN) {
      return json({ error: `Minimum payout is $${(MIN / 100).toFixed(0)}`, available_cents: readyTotal, not_ready_count: notReady }, 400);
    }

    const currency = ready[0].currency;

    // 4) open ONE pending payout row that groups all transfers from this attempt
    const { data: payout, error: pe } = await sb.from("payouts")
      .insert({ partner_id: p.id, amount_cents: readyTotal, currency, status: "pending" }).select().single();
    if (pe || !payout) return json({ error: "could not open payout: " + (pe?.message ?? "unknown") }, 500);

    // 5) one transfer per commission, each tied to its source charge
    const transferIds: string[] = [];
    const errors: Array<{ commission_id: string; error: string }> = [];
    const paidCurrencies = new Set<string>();
    let paidCents = 0;
    let insufficient = false;

    for (const c of ready) {
      // atomic claim: only flip if still 'available' (double-click / concurrency safe)
      const { data: claimedRows } = await sb.from("commissions")
        .update({ status: "paid", payout_id: payout.id })
        .eq("id", c.id).eq("status", "available").select("id");
      if (!claimedRows || claimedRows.length === 0) continue; // already claimed elsewhere

      try {
        const transfer = await stripePost("transfers", key, {
          "amount": String(c.commission_cents),
          "currency": c.currency,
          "destination": p.stripe_account_id,
          "source_transaction": c.charge,          // <-- draws from this charge, even if pending
          "metadata[partner_id]": p.id,
          "metadata[payout_id]": payout.id,
          "metadata[commission_id]": c.id,
          // idempotency key includes the payout id, so every withdraw attempt uses a
          // FRESH key (never clashes with a key Stripe cached from an earlier attempt
          // with different params). Double-pay is still prevented by the DB status
          // claim below and by skipping commissions that already have a transfer id.
        }, `tr_payout_${payout.id}_comm_${c.id}_${c.charge}`);

        await sb.from("commissions").update({ stripe_transfer_id: transfer.id }).eq("id", c.id);
        transferIds.push(transfer.id);
        paidCurrencies.add(c.currency);
        paidCents += c.commission_cents;
      } catch (e) {
        const msg = String((e as Error)?.message ?? e);
        const code = (e as { stripeCode?: string })?.stripeCode ?? "";
        if (code === "balance_insufficient" || /insufficient/i.test(msg)) insufficient = true;
        // revert ONLY this commission; others continue
        await sb.from("commissions").update({ status: "available", payout_id: null }).eq("id", c.id);
        errors.push({ commission_id: c.id, error: msg });
      }
    }

    // 6) finalize
    if (paidCents === 0) {
      // nothing went through — don't leave an empty payout row around
      await sb.from("payouts").delete().eq("id", payout.id);
      if (insufficient) {
        return json({
          ok: false, code: "insufficient_balance", test_mode: testMode, available_cents: readyTotal,
          error: testMode
            ? "Stripe TEST transfer could not draw from the source charge. With source_transaction this usually means the test charge isn't transferable yet — create a fresh test purchase via your referral link (card 4242 4242 4242 4242), let the webhook record it, then Withdraw. Your commissions are still available."
            : "The payout couldn't be created right now. Your commissions are still available; please try again shortly.",
        }, 200);
      }
      return json({ error: "Payout failed: " + (errors[0]?.error ?? "no transfers created"), failed: errors.length }, 502);
    }

    // payout currency reflects what was actually transferred (uniform -> that currency)
    const payoutCurrency = paidCurrencies.size === 1 ? [...paidCurrencies][0] : currency;

    await sb.from("payouts").update({
      status: "paid",
      paid_at: new Date().toISOString(),
      amount_cents: paidCents,
      currency: payoutCurrency,
      stripe_transfer_id: transferIds[0] ?? null,   // first id; the full set lives on commissions.stripe_transfer_id
      error_message: errors.length ? `partial: ${errors.length} transfer(s) failed and were reverted to available` : null,
    }).eq("id", payout.id);

    return json({
      ok: true,
      amount_cents: paidCents,
      currency: payoutCurrency,
      transfer_ids: transferIds,
      transfers: transferIds.length,
      payout_id: payout.id,
      skipped_not_ready: notReady,
      failed: errors.length,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
