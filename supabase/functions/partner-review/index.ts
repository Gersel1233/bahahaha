// Supabase Edge Function: partner-review
// Owner-only (ADMIN_EMAILS) approve/reject of a partner application. Flips
// partners.status to 'approved' or 'rejected' via the service role (bypasses
// the column grants that stop partners from self-approving). Approval simply
// activates the partner's code/link — commissions/payouts/webhook are untouched.
// Deploy:  supabase functions deploy partner-review --no-verify-jwt
// Secrets: ADMIN_EMAILS (comma-separated), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // owner gate — same ADMIN_EMAILS check as admin-stats
    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);
    const admins = (Deno.env.get("ADMIN_EMAILS") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (admins.length === 0 || !admins.includes((user.email ?? "").toLowerCase())) return json({ error: "forbidden" }, 403);

    const { partner_id, action } = await req.json().catch(() => ({}));
    if (!partner_id || (action !== "approve" && action !== "reject"))
      return json({ error: "need partner_id and action=approve|reject" }, 400);

    const patch: Record<string, unknown> = { status: action === "approve" ? "approved" : "rejected" };

    // On APPROVAL, assign the referral code here — it stayed null while pending, so a
    // pending applicant never had a usable code. Re-approving keeps an existing code
    // (never rotate a partner's live link). Reject leaves the code null.
    if (action === "approve") {
      const { data: cur } = await sb.from("partners").select("code").eq("id", partner_id).maybeSingle();
      if (!cur) return json({ error: "partner not found" }, 404);
      if (!cur.code) {
        const code = Array.from({ length: 10 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");
        patch.code = code;
        patch.coupon_code = code;
      }
    }

    const { data, error } = await sb.from("partners")
      .update(patch)
      .eq("id", partner_id)
      .select("id,status,code")
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "partner not found" }, 404);
    return json({ ok: true, id: data.id, status: data.status });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
