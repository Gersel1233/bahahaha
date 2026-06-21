# FYON Affiliate / Partner Program — static site + Supabase + Stripe

A **working, tracked** referral program that lives in **this website** (no separate
server). The static site is frontend only; **Supabase** is the backend (Auth +
Database + RLS + Edge Functions); **Stripe** secrets live ONLY inside Edge Functions.

```
Frontend (GitHub Pages, public):  partner.html  +  index.html ?ref capture
Backend (Supabase):               tables + RLS + leaderboard view + Edge Functions
Money (Stripe, inside Edge Fns):  webhook -> credits commission ; transfers -> payouts
```

## The attribution loop (minimum viable, build this first)
```
1. Visitor opens   site/?ref=SIGMA57575757
2. Site saves      fyon_ref = SIGMA57575757   (60-day cookie + localStorage)
3. Checkout sends  metadata.referral_code = SIGMA57575757   (create-checkout fn)
4. Stripe webhook  finds partner by code -> referral row -> commission row (pending)
5. Dashboard       partner reads their own earnings from Supabase
```

## Files
```
supabase/functions/                         # ← CLI deploy dir (single source of truth)
├── stripe-webhook/        index.ts         # ★ source of truth: credits/reverses commission
├── create-checkout/       index.ts         # ★ checkout WITH referral_code metadata
├── create-promo/          index.ts         # partner's 20%-off coupon code
├── connect-stripe/        index.ts         # Connect Express onboarding
├── check-connect-status/  index.ts         # flips payout_enabled after onboarding
├── request-payout/        index.ts         # withdraw available balance (source_transaction)
├── release-commissions/   index.ts         # pending -> available after the hold
├── backfill-charges/      index.ts         # one-off: fill missing stripe_charge_id
└── admin-stats/           index.ts         # admin dashboard data (ADMIN_EMAILS only)

affiliate/supabase/                         # SQL migrations only (run in the SQL editor)
├── 003_affiliate.sql      # tables + RLS (Supabase Auth) + leaderboard
├── 004_payouts.sql        # payout columns, clawbacks, release_commissions()
├── 005_source_transaction.sql  # commissions.stripe_transfer_id + payout_ready
└── 006_schedule_release.sql    # pg_cron daily release

partner.html                                # the partner dashboard (site root)
admin.html                                  # the admin dashboard (site root)
index.html                                  # ?ref capture + "Become a partner" + nav link
```
> All edge functions live in **`supabase/functions/`** and deploy from there
> (`cd supabase && supabase functions deploy …`). The SQL files live in
> `affiliate/supabase/` and are pasted into the Supabase SQL editor.

## 🔑 Never put these in the frontend
`STRIPE_SECRET_KEY` · `STRIPE_WEBHOOK_SECRET` · `SUPABASE_SERVICE_ROLE_KEY`
→ they go in **Supabase → Edge Functions → Secrets** only.

## ✅ Frontend may contain only
`SUPABASE_URL` · `SUPABASE_ANON_KEY`  (paste them in the CONFIG block of `partner.html`).

---

## Setup checklist (build order — attribution first, payouts last)

### Step 1 — Database
- Supabase → SQL editor → run, in order: `affiliate/supabase/003_affiliate.sql`,
  `004_payouts.sql`, `005_source_transaction.sql`, `006_schedule_release.sql`.

### Step 2 — Auth
- Supabase → Authentication → Email → enable (magic link). Add your site URL to redirect URLs.

### Step 3 — Frontend
- Paste `SUPABASE_URL` + `SUPABASE_ANON_KEY` into `partner.html` CONFIG block. Commit.
- `partner.html` now does sign-up / login / dashboard / leaderboard. ✅

### Step 4 — Stripe (test mode first)
- Set Edge Function secrets:
  ```
  supabase secrets set STRIPE_SECRET_KEY=sk_test_...
  supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...      # from step 5
  supabase secrets set FYON_AFFILIATE_COUPON_ID=...         # a 20% coupon you create once
  supabase secrets set FYON_TEST_PRICE_ID=price_...         # any test Price
  supabase secrets set SITE_URL=https://gersel1233.github.io/bahahaha
  supabase secrets set PAYOUT_HOLD_DAYS=30
  ```
- Deploy the functions (all live in `supabase/functions/`):
  ```
  cd supabase
  supabase functions deploy stripe-webhook        --no-verify-jwt
  supabase functions deploy create-checkout       --no-verify-jwt
  supabase functions deploy create-promo
  supabase functions deploy connect-stripe        --no-verify-jwt
  supabase functions deploy check-connect-status  --no-verify-jwt
  supabase functions deploy request-payout        --no-verify-jwt
  supabase functions deploy release-commissions   --no-verify-jwt
  supabase functions deploy backfill-charges      --no-verify-jwt
  supabase functions deploy admin-stats           --no-verify-jwt
  ```

### Step 5 — Stripe webhook
- Stripe → Developers → Webhooks → add endpoint:
  `https://<project>.supabase.co/functions/v1/stripe-webhook`
  events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`,
  `charge.refunded`, `account.updated`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

### Step 6 — Connect checkout to the referral code
- Your "buy" button calls `create-checkout` with the cookie value:
  ```js
  const ref = (document.cookie.match(/fyon_ref=([^;]+)/)||[])[1] || "";
  const r = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout`,
    { method:"POST", headers:{ "content-type":"application/json" },
      body: JSON.stringify({ referral_code: ref }) });
  location.href = (await r.json()).url;
  ```

## 🧪 Test the loop end-to-end (Stripe TEST mode) — do this before payouts
1. **Create a test product + price** in Stripe (test mode). Copy the Price id (`price_…`).
2. Set it as a secret + deploy the checkout function:
   ```
   supabase secrets set STRIPE_PRICE_ID=price_...
   cd supabase
   supabase functions deploy create-checkout --no-verify-jwt
   supabase functions deploy stripe-webhook --no-verify-jwt
   ```
3. Add the **webhook** (Stripe → Webhooks → `https://vvwevqhdwumnethujxhy.supabase.co/functions/v1/stripe-webhook`,
   events: checkout.session.completed, invoice.paid, invoice.payment_succeeded, charge.refunded) →
   put its secret in `STRIPE_WEBHOOK_SECRET`.
4. Sign up as a **test partner** at `/partner.html` → copy your code, e.g. `SIGMA57575757`.
5. Visit the site as a customer with **`?ref=SIGMA57575757`**, click **Start free trial**,
   pay with test card **`4242 4242 4242 4242`** (any future date / any CVC).
6. The webhook fires → finds the partner by code → creates the referral + commission.
7. Refresh `/partner.html` → **the commission shows up** (pending, 30-day hold). ✅
8. (Optional) Refund the test charge in Stripe → the commission flips to `reversed`. ✅

> Payouts come AFTER this loop is proven. Don't wire `request-payout` / `connect-stripe`
> into the flow until referral attribution + commission crediting work in test mode.

## Build order (don't do payouts first)
1. Partner signup/login ✅ (done in partner.html)
2. Referral link tracking ✅ (?ref capture in index.html)
3. **Stripe webhook commission crediting** ← prove this end-to-end in test mode
4. Dashboard earnings ✅
5. Tier system ✅ (rates from referred revenue)
6. Payout request (`request-payout`)
7. Stripe Connect payouts (`connect-stripe`)

## Safety built in
Idempotent webhook (event id + unique invoice id) · refund auto-reversal · 30-day hold ·
self-referral blocked · first-touch attribution · RLS so partners see only their own rows ·
IPs hashed · secrets never in the browser.
