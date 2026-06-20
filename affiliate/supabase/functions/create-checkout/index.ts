// Supabase Edge Function: create-checkout
// Creates a Stripe Checkout Session that CARRIES the referral code, so the
// webhook can credit the right partner. This is the missing link that makes
// attribution work end-to-end. Call it from the site's "buy" button with the
// referral code read from the fyon_ref cookie/localStorage.
//
// Deploy:  supabase functions deploy create-checkout
// Secrets: STRIPE_SECRET_KEY, FYON_TEST_PRICE_ID (a Stripe Price id), SITE_URL

import Stripe from "https://esm.sh/stripe@14?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20",
});
const SITE = Deno.env.get("SITE_URL") ?? "https://gersel1233.github.io/bahahaha";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const { referral_code, price_id, mode } = await req.json().catch(() => ({}));
  const price = price_id || Deno.env.get("STRIPE_PRICE_ID") || Deno.env.get("FYON_TEST_PRICE_ID");
  if (!price) return new Response(JSON.stringify({ error: "no price" }), { status: 400, headers: cors });

  const session = await stripe.checkout.sessions.create({
    mode: mode || "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: SITE + "/partner.html?paid=1",
    cancel_url: SITE + "/",
    allow_promotion_codes: true,
    client_reference_id: referral_code || undefined,
    metadata: { referral_code: referral_code || "" },           // read by stripe-webhook
    subscription_data: referral_code ? { metadata: { referral_code } } : undefined,
  });
  return new Response(JSON.stringify({ url: session.url }), {
    headers: { ...cors, "content-type": "application/json" },
  });
});
