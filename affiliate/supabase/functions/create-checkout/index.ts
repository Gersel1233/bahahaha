// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session that CARRIES the referral code so the
// webhook can credit the right partner. Works with no referral too.
//
// Deploy:  supabase functions deploy create-checkout --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, STRIPE_PRICE_ID (or FYON_TEST_PRICE_ID), SITE_URL

import Stripe from "https://esm.sh/stripe@14?target=deno";

// CORS on EVERY response (incl. OPTIONS + every error) so the browser never
// sees an opaque "Failed to fetch".
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const SITE = Deno.env.get("SITE_URL") ?? "https://gersel1233.github.io/bahahaha";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const stripe = new Stripe(key, { httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20" });

    const { referral_code, price_id, mode } = await req.json().catch(() => ({}));
    const price = price_id || Deno.env.get("STRIPE_PRICE_ID") || Deno.env.get("FYON_TEST_PRICE_ID");
    if (!price) return json({ error: "no price — set STRIPE_PRICE_ID secret" }, 400);

    const m = mode || "subscription";
    const session = await stripe.checkout.sessions.create({
      mode: m,
      line_items: [{ price, quantity: 1 }],
      success_url: SITE + "/partner.html?paid=1",
      cancel_url: SITE + "/",
      allow_promotion_codes: true,
      client_reference_id: referral_code || undefined,
      metadata: { referral_code: referral_code || "" },              // read by stripe-webhook
      subscription_data: m === "subscription" && referral_code ? { metadata: { referral_code } } : undefined,
    });
    return json({ url: session.url });
  } catch (e) {
    // ALWAYS return CORS + the real reason (e.g. bad price/key) so the UI can show it
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
