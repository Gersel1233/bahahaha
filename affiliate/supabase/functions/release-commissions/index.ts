// Supabase Edge Function: release-commissions
// Matures commissions: pending -> available once past the hold period.
// Manual trigger now; schedule daily later (Supabase cron / pg_cron / GitHub Action).
// Deploy:  supabase functions deploy release-commissions --no-verify-jwt
// Secrets: PAYOUT_HOLD_DAYS (default 30), RELEASE_SECRET (optional gate)
//
// Trigger:
//   curl -X POST "$SUPABASE_URL/functions/v1/release-commissions" \
//     -H "x-release-key: $RELEASE_SECRET"

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-release-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const HOLD = Number(Deno.env.get("PAYOUT_HOLD_DAYS") ?? "30");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // optional shared-secret gate (set RELEASE_SECRET to require it)
    const secret = Deno.env.get("RELEASE_SECRET");
    if (secret) {
      const got = req.headers.get("x-release-key") ?? new URL(req.url).searchParams.get("key");
      if (got !== secret) return json({ error: "forbidden" }, 403);
    }

    const { data, error } = await sb.rpc("release_commissions", { hold_days: HOLD });
    if (error) return json({ error: error.message }, 500);
    return json({ ok: true, released: data ?? 0, hold_days: HOLD });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
