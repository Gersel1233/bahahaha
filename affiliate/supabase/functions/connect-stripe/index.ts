// Supabase Edge Function: connect-stripe  (Stripe Connect Express, recipient/payout-only)
// Calls the Stripe REST API directly with fetch (no Stripe SDK -> no bundling timeout).
// Deploy:  supabase functions deploy connect-stripe --no-verify-jwt
// Secrets: STRIPE_SECRET_KEY, SITE_URL, CONNECT_COUNTRY (optional, default US)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, "content-type": "application/json" } });

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const SITE = Deno.env.get("SITE_URL") ?? "https://gersel1233.github.io/bahahaha";

// Stripe REST helper — form-urlencoded, bracket-style nested params
async function stripe(path: string, key: string, params: Record<string, string | undefined>) {
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null) body.append(k, String(v));
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const d = await r.json();
  if (!r.ok) throw new Error(d?.error?.message || `Stripe ${path} failed (${r.status})`);
  return d;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const key = Deno.env.get("STRIPE_SECRET_KEY");
    if (!key) return json({ error: "STRIPE_SECRET_KEY not set" }, 500);

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: uerr } = await sb.auth.getUser(jwt);
    if (uerr || !user) return json({ error: "not authenticated" }, 401);

    const { data: p } = await sb.from("partners").select("*").eq("user_id", user.id).maybeSingle();
    if (!p) return json({ error: "not a partner" }, 400);

    let acct = p.stripe_account_id as string | null;
    if (!acct) {
      const params: Record<string, string | undefined> = {
        "type": "express",
        "business_type": "individual",
        "email": user.email ?? undefined,
        // transfers-only: payout-focused, light KYC (no card_payments / business profile).
        // Full service agreement (recipient agreement isn't available for EEA Connect platforms).
        "capabilities[transfers][requested]": "true",
        "metadata[partner_id]": p.id,
        "metadata[user_id]": user.id,
      };
      // Default to the platform's own country (DK) when CONNECT_COUNTRY is unset.
      // Stripe supports DK/EEA platforms paying accounts in EEA, UK, US, CA, CH.
      const c = Deno.env.get("CONNECT_COUNTRY");
      if (c) params["country"] = c;

      const account = await stripe("accounts", key, params);
      acct = account.id;
      await sb.from("partners").update({ stripe_account_id: acct }).eq("id", p.id);
    }

    const link = await stripe("account_links", key, {
      "account": acct!,
      "type": "account_onboarding",
      "refresh_url": SITE + "/partner.html?stripe=refresh",
      "return_url": SITE + "/partner.html?stripe=connected",
    });
    return json({ url: link.url });
  } catch (e) {
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
