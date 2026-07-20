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

const RANDOM = () => Array.from({ length: 10 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)]).join("");

// Normalize a social handle to FYON's code charset ^[a-z0-9_-]{3,64}$: strip a
// leading @, lowercase, REPLACE runs of illegal chars (dots, spaces, …) with a
// single "-", collapse repeats, trim leading/trailing -/_, cap at 64. "" if unusable.
// e.g. @m.gersel → m-gersel · @my.name_123 → my-name_123
function slugFromHandle(h: string): string {
  let s = (h ?? "").trim().replace(/^@+/, "").toLowerCase();
  s = s.replace(/[^a-z0-9_-]+/g, "-").replace(/-{2,}/g, "-");  // illegal run → a single dash
  s = s.replace(/^[-_]+|[-_]+$/g, "").slice(0, 64).replace(/[-_]+$/g, "");
  return s;
}

// Derive a UNIQUE, case-insensitive code from the handle. Appends -2, -3… on a
// collision (checked against every existing code, lowercased). Falls back to a
// random code if the handle is empty/too-short/unusable or no slot is free.
async function deriveCode(handle: string): Promise<string> {
  const base = slugFromHandle(handle);
  if (base.length < 3) return RANDOM();
  const { data: rows } = await sb.from("partners").select("code");
  const taken = new Set((rows ?? []).map((r: { code?: string }) => (r.code ?? "").toLowerCase()).filter(Boolean));
  for (let n = 1; n <= 200; n++) {
    const suffix = n === 1 ? "" : `-${n}`;
    const cand = base.slice(0, 64 - suffix.length) + suffix;
    if (!taken.has(cand.toLowerCase())) return cand;
  }
  return RANDOM();
}

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

    // On APPROVAL, assign the referral code — DERIVED from the applicant's handle
    // (e.g. @m.gersel → m-gersel), unique case-insensitively. It stayed null while
    // pending. NEVER rotate an existing code (re-approve keeps it, so a live link
    // never breaks). Reject leaves the code null.
    if (action === "approve") {
      const { data: cur } = await sb.from("partners").select("code,handle").eq("id", partner_id).maybeSingle();
      if (!cur) return json({ error: "partner not found" }, 404);
      if (!cur.code) {
        const code = await deriveCode(cur.handle);
        patch.code = code;
        patch.coupon_code = code;
      }
    }

    // Race-safe: if the lower(code) unique index rejects our pick (two approvals of
    // the same handle at the same instant), fall back to a guaranteed-unique random
    // code so the owner's Approve tap NEVER fails.
    const doUpdate = () => sb.from("partners").update(patch).eq("id", partner_id).select("id,status,code").maybeSingle();
    let { data, error } = await doUpdate();
    if (error && (error as { code?: string }).code === "23505" && action === "approve") {
      const rc = RANDOM(); patch.code = rc; patch.coupon_code = rc;
      ({ data, error } = await doUpdate());
    }
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "partner not found" }, 404);
    return json({ ok: true, id: data.id, status: data.status });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
