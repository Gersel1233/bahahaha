// Supabase Edge Function: connect-stripe  (Stripe Connect Express onboarding)
// Deploy:  supabase functions deploy connect-stripe
// Secrets: STRIPE_SECRET_KEY, PARTNER_RETURN_URL

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20" });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const RETURN = Deno.env.get("PARTNER_RETURN_URL") ?? "https://gersel1233.github.io/bahahaha/partner.html";
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user } } = await sb.auth.getUser(jwt);
  if (!user) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: cors });

  const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
  if (!p) return new Response(JSON.stringify({ error: "not a partner" }), { status: 400, headers: cors });

  let acct = p.stripe_account_id;
  if (!acct) {
    const account = await stripe.accounts.create({ type: "express", metadata: { fyon_partner: p.id } });
    acct = account.id;
    await sb.from("partners").update({ stripe_account_id: acct }).eq("id", p.id);
  }
  const link = await stripe.accountLinks.create({
    account: acct, type: "account_onboarding",
    refresh_url: RETURN + "?stripe=refresh", return_url: RETURN + "?stripe=done",
  });
  return new Response(JSON.stringify({ url: link.url }), { headers: { ...cors, "content-type": "application/json" } });
});
