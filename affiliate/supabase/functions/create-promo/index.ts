// Supabase Edge Function: create-promo
// Creates a Stripe promotion code (the partner's 20%-off coupon code) on a
// shared coupon, so the coupon path ALSO attributes sales. Called once at enroll.
// Deploy:  supabase functions deploy create-promo
// Secrets: STRIPE_SECRET_KEY, FYON_AFFILIATE_COUPON_ID

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20" });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const COUPON = Deno.env.get("FYON_AFFILIATE_COUPON_ID") ?? "";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (!COUPON) return new Response(JSON.stringify({ skipped: "no coupon configured" }), { headers: { ...cors, "content-type": "application/json" } });

  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user } } = await sb.auth.getUser(jwt);
  if (!user) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: cors });

  const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
  if (!p || p.stripe_promo_code_id) return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, "content-type": "application/json" } });

  const promo = await stripe.promotionCodes.create({ coupon: COUPON, code: p.code, metadata: { fyon_partner: p.id } });
  await sb.from("partners").update({ stripe_promo_code_id: promo.id }).eq("id", p.id);
  return new Response(JSON.stringify({ ok: true, id: promo.id }), { headers: { ...cors, "content-type": "application/json" } });
});
