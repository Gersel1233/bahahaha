// Supabase Edge Function: request-payout  (build this LAST)
// Pays out a partner's available balance via Stripe Connect transfer.
// Deploy:  supabase functions deploy request-payout
// Secrets: STRIPE_SECRET_KEY

import Stripe from "https://esm.sh/stripe@14?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { httpClient: Stripe.createFetchHttpClient(), apiVersion: "2024-06-20" });
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const MIN = 1000; // $10.00

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
  const { data: { user } } = await sb.auth.getUser(jwt);
  if (!user) return new Response(JSON.stringify({ error: "auth" }), { status: 401, headers: cors });

  const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
  if (!p?.payout_enabled || !p?.stripe_account_id)
    return new Response(JSON.stringify({ error: "connect Stripe first" }), { status: 400, headers: cors });

  // mature pending -> available
  await sb.from("commissions").update({ status: "available" })
    .eq("partner_id", p.id).eq("status", "pending").lte("available_at", new Date().toISOString());

  const { data: avail } = await sb.from("commissions").select("commission_cents")
    .eq("partner_id", p.id).eq("status", "available");
  const amount = (avail ?? []).reduce((s, c) => s + c.commission_cents, 0);
  if (amount < MIN) return new Response(JSON.stringify({ error: "minimum payout is $10" }), { status: 400, headers: cors });

  const transfer = await stripe.transfers.create({ amount, currency: "usd", destination: p.stripe_account_id, metadata: { fyon_partner: p.id } });
  await sb.from("payouts").insert({ partner_id: p.id, amount_cents: amount, stripe_transfer_id: transfer.id, status: "paid" });
  await sb.from("commissions").update({ status: "paid" }).eq("partner_id", p.id).eq("status", "available");
  return new Response(JSON.stringify({ paid_cents: amount }), { headers: { ...cors, "content-type": "application/json" } });
});
