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

All functions live in **`supabase/functions/`** — deploy from there:
```bash
cd supabase
supabase functions deploy create-checkout       --no-verify-jwt
supabase functions deploy stripe-webhook        --no-verify-jwt
supabase functions deploy connect-stripe        --no-verify-jwt
supabase functions deploy check-connect-status  --no-verify-jwt
supabase functions deploy create-promo
supabase functions deploy request-payout        --no-verify-jwt
supabase functions deploy release-commissions   --no-verify-jwt
supabase functions deploy backfill-charges      --no-verify-jwt
supabase functions deploy admin-stats           --no-verify-jwt
```
- [ ] `create-checkout`     (`--no-verify-jwt`)
- [ ] `stripe-webhook`      (`--no-verify-jwt`)
- [ ] `connect-stripe`      (`--no-verify-jwt`)
- [ ] `check-connect-status`(`--no-verify-jwt`)
- [ ] `create-promo`
- [ ] `request-payout`      (`--no-verify-jwt`)
- [ ] `release-commissions` (`--no-verify-jwt`)
- [ ] `backfill-charges`    (`--no-verify-jwt`)
- [ ] `admin-stats`         (`--no-verify-jwt`)

## C. Secrets (Supabase → Edge Functions → Secrets)

- [ ] `STRIPE_SECRET_KEY`   = **live** `sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET`= **live** webhook signing secret (`whsec_...`)
- [ ] `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (auto on Supabase, confirm present)
- [ ] `STRIPE_PRICE_ID`     = **live** recurring price id (`price_...`)
- [ ] `SITE_URL`            = final site URL (GitHub Pages or custom domain)
- [ ] `PAYOUT_HOLD_DAYS`    = `30` (set to `0` only while testing)
- [ ] `MIN_PAYOUT_CENTS`    = `1440` (optional; default is 1440 = $14.40 ≈ 3 customers). Keep in sync with `MIN_PAYOUT` in partner.html
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

## G. Automatic commission release (REQUIRED before launch)

Commissions are created `pending` and must move to `available` after the hold
period automatically — never by hand in production.

### Option 1 — Supabase pg_cron (preferred: no public endpoint)

- [ ] In the Supabase SQL editor, run `affiliate/supabase/006_schedule_release.sql`
      (enables `pg_cron` and schedules `release_commissions(30)` daily at 03:07 UTC)
- [ ] Verify the job exists:
      ```sql
      select jobid, schedule, command, active from cron.job where jobname='release-commissions-daily';
      ```
- [ ] After a day, check runs:
      ```sql
      select status, return_message, start_time
      from cron.job_run_details
      where jobid = (select jobid from cron.job where jobname='release-commissions-daily')
      order by start_time desc limit 5;
      ```

> The hold is hard-coded to **30** in the SQL job (independent of
> `PAYOUT_HOLD_DAYS`). Do not set it to 0 in production.

### Option 2 — GitHub Actions (only if pg_cron isn't available on your plan)

Use ONE option, not both.

- [ ] Supabase secret: `supabase secrets set RELEASE_SECRET="$(openssl rand -hex 16)"`
- [ ] Redeploy so the gate is required: `cd supabase && supabase functions deploy release-commissions --no-verify-jwt`
      (the function now returns 503 if `RELEASE_SECRET` is unset, 403 without the header — never public)
- [ ] Add the SAME value as a GitHub repo secret named `RELEASE_SECRET`
      (repo → Settings → Secrets and variables → Actions → New repository secret)
- [ ] The workflow `.github/workflows/release-commissions.yml` runs daily (03:17 UTC);
      trigger once manually via the Actions tab → "Release commissions (daily)" → Run workflow
- [ ] Confirm the run shows `HTTP 200` and `{ "ok": true, "released": N, "hold_days": 30 }`
      (ensure `supabase secrets set PAYOUT_HOLD_DAYS=30` so this path uses a 30-day hold)

## H. Flip to production

- [ ] `PAYOUT_HOLD_DAYS = 30` (and the pg_cron job uses 30)
- [ ] Automatic release scheduled (Option 1 or 2 above) and verified
- [ ] Remove any test partners / test commissions if desired
- [ ] Verify the commission ledger looks right:
      ```sql
      select status, count(*), sum(commission_cents) from commissions group by status;
      ```
- [ ] Announce 🎉
