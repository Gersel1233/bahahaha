// Supabase Edge Function: join-waitlist
// Public endpoint for the marketing-site waitlist. Accepts an anonymous POST,
// validates the email, and upserts into `waitlist` using the service role so
// the table stays write-only from the browser (no service-role key in the
// frontend; reads remain admin-only).
//
// Deploy:  supabase functions deploy join-waitlist
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (both injected by default)
// Body:    { name?, email, use_case?, referral_code? }  ->  { ok: true }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// Best-effort, in-memory rate limit (per warm isolate): max N inserts / window
// per client IP. Ephemeral by design — just enough to blunt trivial spam.
const RL_MAX = 6;
const RL_WINDOW_MS = 60_000;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < RL_WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > RL_MAX;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);

  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip)) return json({ error: "rate_limited" }, 429);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return json({ error: "bad_json" }, 400); }

  const email = String(body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 254) return json({ error: "invalid_email" }, 400);

  const clip = (v: unknown, n: number) => {
    const s = (v == null ? "" : String(v)).trim();
    return s ? s.slice(0, n) : null;
  };
  const name = clip(body.name, 120);
  const use_case = clip(body.use_case, 1000);
  const referral_code = clip(body.referral_code, 24)?.toUpperCase() ?? null;

  // Insert; on duplicate email (unique lower(email) -> 23505) treat as success
  // and backfill referral_code only if it was previously missing (first-touch).
  const ins = await sb.from("waitlist").insert({
    email, name, use_case, referral_code, source: "marketing_site",
  });

  if (ins.error) {
    const dup = ins.error.code === "23505" || /duplicate|unique/i.test(ins.error.message || "");
    if (!dup) return json({ error: "insert_failed" }, 500);
    if (referral_code) {
      await sb.from("waitlist")
        .update({ referral_code })
        .filter("email", "ilike", email)
        .is("referral_code", null);
    }
  }

  return json({ ok: true });
});
