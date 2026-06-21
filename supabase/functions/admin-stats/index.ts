// Supabase Edge Function: admin-stats
// Full admin dashboard data: Stripe revenue + affiliate + payouts + recent rows.
// Gated to ADMIN_EMAILS. Non-admins get 403 (admin.html hides everything).
// Deploy:  supabase functions deploy admin-stats --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, ADMIN_EMAILS  (comma-separated)
//
// Response is ADDITIVE — it keeps the original fields (stripe.*, commissions.*,
// paid_out_cents) that partner.html's admin card relies on, and adds the rest.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const sum = (rows: any[] | null, f: string) => (rows ?? []).reduce((s, r) => s + (Number(r?.[f]) || 0), 0);

async function sget(path: string, key: string) {
  const r = await fetch("https://api.stripe.com/v1/" + path, { headers: { "Authorization": "Bearer " + key } });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} ${r.status}`);
  return d;
}
// auto-paginate a Stripe list (bounded so we never hang the function)
async function slist(path: string, key: string, query = "", cap = 12): Promise<any[]> {
  let out: any[] = [], pages = 0, after: string | null = null;
  const base = "https://api.stripe.com/v1/" + path + "?limit=100" + (query ? "&" + query : "");
  while (pages < cap) {
    const url = after ? base + "&starting_after=" + after : base;
    const r = await fetch(url, { headers: { "Authorization": "Bearer " + key } });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} ${r.status}`);
    out = out.concat(d.data || []);
    if (!d.has_more || !(d.data && d.data.length)) break;
    after = d.data[d.data.length - 1].id; pages++;
  }
  return out;
}
function monthlyCents(unit: number, qty: number, interval: string, ic: number) {
  const amt = (unit || 0) * (qty || 1); const n = ic || 1;
  if (interval === "day") return amt * 30 / n;
  if (interval === "week") return amt * 52 / 12 / n;
  if (interval === "year") return amt / 12 / n;
  return amt / n; // month / default
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);
    const admins = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (admins.length === 0 || !admins.includes((user.email ?? "").toLowerCase())) return json({ admin: false, error: "forbidden" }, 403);

    // ---------- Supabase (owned data) ----------
    const [pc, rc, comms, pays, recRef, recComm, recPay] = await Promise.all([
      sb.from("partners").select("id", { count: "exact", head: true }),
      sb.from("referrals").select("id", { count: "exact", head: true }),
      sb.from("commissions").select("commission_cents,gross_cents,status,currency").limit(10000),
      sb.from("payouts").select("amount_cents,status,currency").limit(10000),
      sb.from("referrals").select("id,status,attributed_via,created_at,stripe_customer_id,partners(code)").order("created_at", { ascending: false }).limit(10),
      sb.from("commissions").select("commission_cents,gross_cents,rate,kind,status,currency,created_at").order("created_at", { ascending: false }).limit(10),
      sb.from("payouts").select("amount_cents,currency,status,stripe_transfer_id,created_at").order("created_at", { ascending: false }).limit(10),
    ]);

    const C = comms.data ?? [];
    const byStatus = (st: string) => C.filter((c) => c.status === st);
    const commAgg = (st: string) => ({ n: byStatus(st).length, cents: sum(byStatus(st), "commission_cents") });
    const P = pays.data ?? [];
    const payAgg = (st: string) => ({ n: P.filter((p) => p.status === st).length, cents: sum(P.filter((p) => p.status === st), "amount_cents") });

    // ---------- Stripe (revenue) — each guarded so one failure can't 500 ----------
    let stripe_available = 0, stripe_pending = 0, currency = "usd";
    try {
      const bal = await sget("balance", key);
      stripe_available = (bal.available ?? []).reduce((s: number, a: any) => s + (a.amount || 0), 0);
      stripe_pending = (bal.pending ?? []).reduce((s: number, a: any) => s + (a.amount || 0), 0);
      currency = bal.available?.[0]?.currency || bal.pending?.[0]?.currency || "usd";
    } catch (_) { /* leave zeros */ }

    let mrr = 0, activeSubs = 0;
    try {
      const subs = await slist("subscriptions", key, "status=active", 12);
      activeSubs = subs.length;
      for (const s of subs) for (const it of (s.items?.data ?? [])) {
        const pr = it.price || {}; const rec = pr.recurring || {};
        mrr += monthlyCents(pr.unit_amount || 0, it.quantity || 1, rec.interval || "month", rec.interval_count || 1);
      }
    } catch (_) { /* */ }

    let totalCustomers = 0;
    try { totalCustomers = (await slist("customers", key, "", 20)).length; } catch (_) { /* */ }

    let totalRevenue = 0;
    try {
      const charges = await slist("charges", key, "", 20);
      for (const ch of charges) if (ch.paid) totalRevenue += (ch.amount_captured || 0) - (ch.amount_refunded || 0);
    } catch (_) { /* */ }

    return json({
      ok: true, admin: true, test_mode: key.startsWith("sk_test_"), currency,
      generated_at: new Date().toISOString(),

      // -- existing fields (partner.html admin card depends on these) --
      stripe: { available_cents: stripe_available, pending_cents: stripe_pending, currency },
      commissions: { pending_cents: commAgg("pending").cents, available_cents: commAgg("available").cents },
      paid_out_cents: payAgg("paid").cents,

      // -- new: revenue --
      revenue: { total_cents: Math.round(totalRevenue), mrr_cents: Math.round(mrr), active_subscriptions: activeSubs, total_customers: totalCustomers },

      // -- new: affiliate --
      affiliate: {
        partners: pc.count ?? 0,
        referrals: rc.count ?? 0,
        commissions: {
          pending: commAgg("pending"), available: commAgg("available"),
          paid: commAgg("paid"), reversed: commAgg("reversed"),
        },
      },

      // -- new: payouts --
      payouts: { paid: payAgg("paid"), pending: payAgg("pending"), failed: payAgg("failed") },

      // -- new: recent rows --
      recent: {
        referrals: recRef.data ?? [],
        commissions: recComm.data ?? [],
        payouts: recPay.data ?? [],
      },
    });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
