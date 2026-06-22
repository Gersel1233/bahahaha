# Lesreg — Fyon marketing site, waitlist & partner program

**Lesreg** is the company; **Fyon** is the product. This repo is the **Lesreg
marketing site** plus the affiliate/admin system. Static site on GitHub Pages
(`https://gersel1233.github.io/bahahaha/`), backed by Supabase (Auth + Postgres +
Edge Functions) and Stripe (Connect payouts for partners).

> **This marketing site does not sell Fyon directly.** Purchases happen later, in
> the separate Fyon product app. Here we only collect early-access / waitlist leads.

## Launch state

- **Current state — WAITLIST MODE.** The product app is not live yet. The homepage
  product CTAs ("Join waitlist" / "Get early access") **do not** start Stripe
  checkout — they open the waitlist modal (name, email, optional use case). The
  submission is POSTed to the **`join-waitlist` Edge Function**, which validates
  the email and writes to the Supabase `waitlist` table using the service role
  (the browser never holds anything but the public anon key). Any `?ref=CODE` is
  captured into a 60-day cookie + `localStorage` and sent along as `referral_code`
  so affiliate attribution survives until the product launches.
- **Future state — the Fyon product app** (planned at `app.lesreg.com` or
  `fyon.lesreg.com`). When it's ready, set `PRODUCT_APP_URL` in the CTA config
  near the bottom of `index.html` (e.g. `"https://app.lesreg.com"`). Every product
  CTA then redirects there instead of opening the modal, **forwarding `?ref=CODE`**
  when a referral is present, so affiliate tracking continues into the product app.
  No other change is needed to flip out of waitlist mode.

## Pages (repo root = live site)

| File | What it is |
|------|------------|
| `index.html` | Marketing homepage + waitlist modal (`styles.css`, `site.js`, `image-slot.js`) |
| `partner.html` | Affiliate **partner** dashboard (Google + magic-link sign-in) |
| `admin.html` | **Admin** dashboard, gated to `ADMIN_EMAILS` (Google + magic-link) |
| `globe.html` | Bare rotating globe embedded by the homepage (`?bare=1`) |
| `liquid-glass.css/js`, `loader.js` | Shared UI (glass buttons, loading screen) |
| `archive/prototypes/` | Old design prototypes (kept for reference, not live) |

## Auth

- **Partner & admin** dashboards support **Google sign-in** (Supabase OAuth) with
  **magic-link email as a fallback**. Enable the Google provider in
  Supabase → Authentication → Providers, and add the site URL to the allowed
  redirect URLs.
- Admin access is restricted by the `ADMIN_EMAILS` secret (checked in `admin-stats`).

## Backend

- **Edge functions** live in **`supabase/functions/`** (single source of truth) —
  deploy with `cd supabase && supabase functions deploy <name> --no-verify-jwt`.
  The public **`join-waitlist`** function backs the homepage waitlist (validates
  email, upserts by `lower(email)`, preserves `referral_code`, light per-IP rate
  limit). Affiliate/payout functions are unchanged.
- **SQL migrations** live in `affiliate/supabase/` — run in the Supabase SQL editor:
  `003_affiliate.sql` → `004_payouts.sql` → `005_source_transaction.sql` →
  `006_schedule_release.sql` → `007_waitlist.sql`.
- See `affiliate/README.md`, `affiliate/SETUP.md`, and `affiliate/LAUNCH_CHECKLIST.md`
  for the full affiliate / payout setup.

## Notes

- Secrets (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
  live only in Supabase Edge Function secrets — never in the frontend.
- Pages deploys from `main` via `.github/workflows/deploy.yml`.
