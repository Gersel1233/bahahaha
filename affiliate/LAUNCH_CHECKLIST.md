# Fyon Partners — Live Launch Checklist

Work top to bottom. Everything in **TEST mode** first, then flip to **LIVE**.

> Money is always in integer **cents**. Secrets live **only** in Supabase Edge
> Function secrets — never in `partner.html` / the frontend.

---

## A. Database (Supabase SQL editor)

- [ ] Run `affiliate/supabase/003_affiliate.sql` (tables, RLS, tiers, leaderboard)
- [ ] Run `affiliate/supabase/004_payouts.sql` (payout_id, currency, clawbacks, `release_commissions()`)
- [ ] Confirm tables exist: `partners, referrals, commissions, payouts, commission_adjustments, stripe_events, affiliate_tiers`
- [ ] Confirm function exists: `select release_commissions(30);` returns an integer

## B. Edge Functions (deployed)

- [ ] `create-checkout`     (`--no-verify-jwt`)
- [ ] `stripe-webhook`      (`--no-verify-jwt`)
- [ ] `connect-stripe`      (`--no-verify-jwt`)
- [ ] `check-connect-status`(`--no-verify-jwt`)
- [ ] `create-promo`
- [ ] `request-payout`      (`--no-verify-jwt`)
- [ ] `release-commissions` (`--no-verify-jwt`)

## C. Secrets (Supabase → Edge Functions → Secrets)

- [ ] `STRIPE_SECRET_KEY`   = **live** `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET`= **live** webhook signing secret (`whsec_...`)
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto on Supabase, confirm present)
- [ ] `STRIPE_PRICE_ID`     = **live** recurring price id (`price_...`)
- [ ] `SITE_URL`            = final site URL (GitHub Pages or custom domain)
- [ ] `PAYOUT_HOLD_DAYS`    = `30` (set to `0` only while testing)
- [ ] `MIN_PAYOUT_CENTS`    = `1000` (optional; default is $10)
- [ ] `BUSINESS_URL`        = your business/marketing URL (Connect onboarding pre-fill)
- [ ] `RELEASE_SECRET`      = random string (optional gate for `release-commissions`)

## D. Stripe (LIVE)

- [ ] Toggle Stripe dashboard to **live** mode
- [ ] Create the **live** recurring Price → copy id into `STRIPE_PRICE_ID`
- [ ] Create the **live** webhook → `https://<project>.supabase.co/functions/v1/stripe-webhook`
      - events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`,
        `charge.refunded`, `refund.created`, `account.updated`
      - copy signing secret → `STRIPE_WEBHOOK_SECRET`
- [ ] **Connect** is activated in live mode (Settings → Connect)
- [ ] Connect platform profile/branding set (name shows as "Fyon" to partners)

## E. Frontend

- [ ] `partner.html` CONFIG has the correct `SUPABASE_URL` + **anon** key + `SITE_URL`
- [ ] If using a custom domain: update `SITE_URL` (secret) **and** `SITE_URL` in `partner.html`
      and the GitHub Pages custom-domain settings (`CNAME`)
- [ ] Partner Terms page added and linked
- [ ] Privacy + Terms links in the footer point to real pages (not `#`)

## F. Live smoke test (use small real amounts, then refund)

- [ ] Live test purchase via a referral link → `referrals` + `commissions` rows appear
- [ ] Partner Stripe Connect onboarding completes → `payout_enabled = true`, "Stripe connected" badge
- [ ] `release-commissions` moves a matured commission to `available`
- [ ] Withdraw a small amount → Stripe **Transfer** created, `commissions = paid`, `payouts = paid`
- [ ] Refund the test charge → unpaid commission becomes `reversed`; if already paid, a
      `commission_adjustments` (negative) row is logged (no auto-pull from partner)

## G. Flip to production

- [ ] Set `PAYOUT_HOLD_DAYS = 30`
- [ ] Schedule `release-commissions` daily (Supabase Scheduled Functions / pg_cron / GitHub Action)
- [ ] Remove any test partners / test commissions if desired
- [ ] Announce 🎉
