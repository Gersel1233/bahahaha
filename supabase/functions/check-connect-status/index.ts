// Supabase Edge Function: check-connect-status  (no Stripe SDK — direct REST via fetch)
// Retrieves the connected account and flips partners.payout_enabled.
// Deploy:  supabase functions deploy check-connect-status --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

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
    if (!p.stripe_account_id) return json({ connected: false, payout_enabled: false });

    const r = await fetch("https://api.stripe.com/v1/accounts/" + p.stripe_account_id, {
      headers: { "Authorization": "Bearer " + key },
    });
    const acct = await r.json();
    if (!r.ok) return json({ error: acct?.error?.message || ("Stripe retrieve failed " + r.status) }, 500);

    const payout_enabled = !!(acct.charges_enabled && acct.payouts_enabled);
    await sb.from("partners").update({ payout_enabled }).eq("id", p.id);

    return json({
      connected: true, payout_enabled,
      details_submitted: acct.details_submitted,
      charges_enabled: acct.charges_enabled,
      payouts_enabled: acct.payouts_enabled,
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
