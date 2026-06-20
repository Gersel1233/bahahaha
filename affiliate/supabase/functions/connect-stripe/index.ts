// Supabase Edge Function: connect-stripe  (Stripe Connect Express onboarding)
// Deploy:  supabase functions deploy connect-stripe --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, SITE_URL, CONNECT_COUNTRY (optional, default US)

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = Deno.env.get("SITE_URL") ?? "https://gersel1233.github.io/bahahaha";
const COUNTRY = Deno.env.get("CONNECT_COUNTRY") ?? "US";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);
    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20" });

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);

    const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
    if (!p) return json({ error: "not a partner" }, 400);

    let acct = p.stripe_account_id as string | null;
    if (!acct) {
      const account = await stripe.accounts.create({
        type: "express",
        country: COUNTRY,
        business_type: "individual",
        email: user.email ?? undefined,
        // Recipient agreement = payout-only: transfers without card_payments,
        // lighter KYC, and the affiliate is a payout recipient (not a seller).
        capabilities: { transfers: { requested: true } },
        tos_acceptance: { service_agreement: "recipient" },
        metadata: { partner_id: p.id, user_id: user.id },
      });
      acct = account.id;
      await sb.from("partners").update({ stripe_account_id: acct }).eq("id", p.id);
    }

    const link = await stripe.accountLinks.create({
      account: acct,
      type: "account_onboarding",
      refresh_url: SITE + "/partner.html?stripe=refresh",
      return_url: SITE + "/partner.html?stripe=connected",
    });
    return json({ url: link.url });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
