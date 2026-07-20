// Supabase Edge Function: send-push
// Fired by a Database Webhook on INSERT to `partners`. When a new APPLICATION
// lands (status='pending'), it Web-Pushes every stored admin subscription (phone
// + laptop) so the owner is notified instantly — even with the app closed.
// Money logic untouched: read-only on partners, read/prune on partner_push_subscriptions.
//
// Deploy:  supabase functions deploy send-push --no-verify-jwt
// Secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY,
//          VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@...), PUSH_HOOK_SECRET
// DB webhook: Database → Webhooks → INSERT on `partners` → POST this function's
//          URL, adding header  x-webhook-secret: <PUSH_HOOK_SECRET>

import webpush from "npm:web-push@3.6.7";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const HOOK_SECRET = Deno.env.get("PUSH_HOOK_SECRET") ?? "";
webpush.setVapidDetails(
  Deno.env.get("VAPID_SUBJECT") || "mailto:mikkelgersel16@gmail.com",
  Deno.env.get("VAPID_PUBLIC_KEY")!,
  Deno.env.get("VAPID_PRIVATE_KEY")!,
);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");
  try {
    // Secure the webhook — FAIL CLOSED. If no shared secret is configured, refuse to run
    // (otherwise anyone could POST fake application notifications). If set, the header must match.
    if (!HOOK_SECRET) return json({ error: "PUSH_HOOK_SECRET not configured — refusing" }, 503);
    if (req.headers.get("x-webhook-secret") !== HOOK_SECRET) return json({ error: "forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const rec = body.record ?? body;                 // Supabase webhook posts { type, table, record, ... }
    if (!rec || rec.status !== "pending") return json({ skipped: "not a new application" });

    const platform = rec.promo_channel || "New platform";
    const bits = [platform, rec.handle].filter(Boolean).join(" · ");
    const bodyText = bits + (rec.content_type ? ` — ${rec.content_type}` : "");
    const payload = JSON.stringify({
      title: "New partner application",
      body: bodyText || "Someone just applied — tap to review.",
      url: "partner.html?view=approvals",
      tag: "partner-application",
    });

    const { data: subs } = await sb.from("partner_push_subscriptions").select("endpoint,p256dh,auth");
    let sent = 0, pruned = 0;
    for (const s of subs ?? []) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
        sent++;
      } catch (e: any) {
        // 404/410 → the browser dropped this subscription; clean it up.
        if (e?.statusCode === 404 || e?.statusCode === 410) { await sb.from("partner_push_subscriptions").delete().eq("endpoint", s.endpoint); pruned++; }
      }
    }
    return json({ ok: true, sent, pruned });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
