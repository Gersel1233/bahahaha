# Fyon Affiliate — opsætning skærm-for-skærm (≈20 min)

Dine værdier er allerede sat ind. Bare følg trinene. Ingen teori.

```
Projekt-ref:  vvwevqhdwumnethujxhy
Supabase URL: https://vvwevqhdwumnethujxhy.supabase.co
Site:         https://gersel1233.github.io/bahahaha
Webhook URL:  https://vvwevqhdwumnethujxhy.supabase.co/functions/v1/stripe-webhook
```

---

## 1) Supabase: kør SQL
1. Gå til **supabase.com** → log ind → vælg dit projekt.
2. Venstre menu → **SQL Editor** → **+ New query**.
3. Åbn filen `affiliate/supabase/003_affiliate.sql` her i repoet, kopiér **alt**, indsæt i editoren.
4. Tryk **Run** (nederst til højre). Du skal se "Success".

## 2) Supabase: slå Email Auth til
1. Venstre menu → **Authentication** → **Providers**.
2. Klik **Email** → slå **Enable** til → **Save**.

## 3) Supabase: tilføj redirect URL
1. **Authentication** → **URL Configuration**.
2. **Site URL** = `https://gersel1233.github.io/bahahaha/partner.html`
3. Under **Redirect URLs** → **Add URL** → indsæt:
   `https://gersel1233.github.io/bahahaha/partner.html` → **Save**.

## 4) Stripe (TEST mode): opret product + price
1. Gå til **dashboard.stripe.com** → slå **Test mode** til (kontakt øverst til højre).
2. Venstre menu → **Product catalog** → **+ Add product**.
3. Navn: `Fyon` · Pris: fx `19.00 USD` · **Recurring / Monthly** → **Save**.
4. På produktet: find prisen → kopiér **API ID** (starter med `price_…`). Gem den.
5. Øverst → **Developers → API keys** → kopiér **Secret key** (`sk_test_…`). Gem den.

## 5) Supabase CLI: hent functions + sæt secrets
Åbn en terminal og kør (indsæt dine `sk_test_…` og `price_…`):
```bash
npm install -g supabase
supabase login
git clone https://github.com/Gersel1233/bahahaha
cd bahahaha
mkdir -p supabase/functions
cp -r affiliate/supabase/functions/* supabase/functions/
supabase link --project-ref vvwevqhdwumnethujxhy

supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_DIN_NØGLE \
  STRIPE_PRICE_ID=price_DIN_PRIS \
  SITE_URL=https://gersel1233.github.io/bahahaha \
  PAYOUT_HOLD_DAYS=30
```

## 6) Supabase CLI: deploy de to functions
```bash
supabase functions deploy create-checkout --no-verify-jwt
supabase functions deploy stripe-webhook --no-verify-jwt
```

## 7) Stripe: tilføj webhook endpoint
1. Stripe (stadig **Test mode**) → **Developers → Webhooks** → **+ Add endpoint**.
2. **Endpoint URL**:
   `https://vvwevqhdwumnethujxhy.supabase.co/functions/v1/stripe-webhook`
3. **Select events** → tilføj:
   `checkout.session.completed`, `invoice.paid`, `invoice.payment_succeeded`, `charge.refunded`
4. **Add endpoint** → klik på det → kopiér **Signing secret** (`whsec_…`).
5. Tilbage i terminalen:
```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_DIN_SECRET
```
(Ingen ny deploy nødvendig — secrets læses live.)

## 8) Test hele flowet
1. Åbn `https://gersel1233.github.io/bahahaha/partner.html` → skriv din email → **Send magic link** → klik linket i mailen → du er inde, og din kode vises (fx `SIGMA57575757`).
2. Åbn i en **ny fane**: `https://gersel1233.github.io/bahahaha/?ref=SIGMA57575757`
3. Scroll ned → **Start free trial →**.
4. Betal med testkort: **`4242 4242 4242 4242`**, udløb = en dato i fremtiden, CVC = `123`, postnr = `12345`.
5. Gå tilbage til **partner.html** → opdater siden → **din commission vises** (pending, i 30-dages hold). 🎉

> Refund test: i Stripe → find betalingen → **Refund** → commission skifter til `reversed`.

---

### Hvis noget driller
- **Magic link kommer ikke?** Tjek spam, og at redirect-URL'en i trin 3 er præcis `…/partner.html`.
- **"Checkout isn't live yet"?** `STRIPE_PRICE_ID` mangler eller `create-checkout` er ikke deployet (trin 5–6).
- **Commission dukker ikke op?** Stripe → Webhooks → klik endpointet → se om events er "Succeeded". Hvis 400: `STRIPE_WEBHOOK_SECRET` er forkert (trin 7).
- **Payouts** sætter vi op bagefter — først skal dette loop virke.
