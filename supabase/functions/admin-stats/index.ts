// Supabase Edge Function: admin-stats
// Launch-verification dashboard data: Stripe platform balance + commission/payout totals.
// Gated to ADMIN_EMAILS (comma-separated). Non-admins get 403 (card stays hidden).
// Deploy:  supabase functions deploy admin-stats --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, ADMIN_EMAILS  (e.g. "you@email.com,partner@email.com")

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const sum = (rows: Array<Record<string, number>> | null, f: string) =>
  (rows ?? []).reduce((s, r) => s + (Number(r[f]) || 0), 0);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);

    const admins = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    const email = (user.email ?? "").toLowerCase();
    if (admins.length === 0 || !admins.includes(email)) return json({ admin: false, error: "forbidden" }, 403);

    // commission + payout totals (platform-wide)
    const [pend, avail, paid] = await Promise.all([
      sb.from("commissions").select("commission_cents").eq("status", "pending"),
      sb.from("commissions").select("commission_cents").eq("status", "available"),
      sb.from("payouts").select("amount_cents").eq("status", "paid"),
    ]);

    // Stripe platform balance
    const r = await fetch("https://api.stripe.com/v1/balance", { headers: { "Authorization": "Bearer " + key } });
    const bal = await r.json();
    if (!r.ok) return json({ error: bal?.error?.message || ("balance retrieve failed " + r.status) }, 502);
    const availArr: Array<{ amount: number; currency: string }> = bal.available ?? [];
    const pendArr: Array<{ amount: number; currency: string }> = bal.pending ?? [];

    return json({
      ok: true,
      admin: true,
      test_mode: key.startsWith("sk_test_"),
      stripe: {
        available_cents: availArr.reduce((s, a) => s + (a.amount || 0), 0),
        pending_cents: pendArr.reduce((s, a) => s + (a.amount || 0), 0),
        currency: (availArr[0]?.currency || "usd"),
      },
      commissions: {
        pending_cents: sum(pend.data, "commission_cents"),
        available_cents: sum(avail.data, "commission_cents"),
      },
      paid_out_cents: sum(paid.data, "amount_cents"),
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
