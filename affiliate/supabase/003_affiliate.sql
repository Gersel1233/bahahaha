-- ============================================================================
-- FYON Affiliate / Partner Program — Supabase schema (003_affiliate.sql)
-- Run in the Supabase SQL editor (or as a migration) on your FYON project.
-- Money is stored in integer CENTS everywhere (never floats).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- partners ----------
create table if not exists partners (
  id                    uuid primary key default gen_random_uuid(),
  user_id               text unique not null,          -- your app's user id (FYON session/user)
  code                  text unique not null,           -- referral code, e.g. SIGMA57575757
  coupon_code           text unique,                    -- usually = code (the 20% OFF code)
  stripe_promo_code_id  text,                            -- Stripe promotion_code id
  stripe_account_id     text,                            -- Stripe Connect (Express) account
  payout_enabled        boolean not null default false,  -- set true when Connect onboarding done
  show_on_leaderboard   boolean not null default true,
  hide_username         boolean not null default false,
  display_name          text,
  created_at            timestamptz not null default now()
);

-- ---------- referral_clicks (raw link hits, for analytics + fraud) ----------
create table if not exists referral_clicks (
  id           bigint generated always as identity primary key,
  code         text not null,
  visitor_id   text,            -- first-party cookie id
  ip_hash      text,            -- sha256(ip + salt) — never store raw IP
  user_agent   text,
  landing_path text,
  created_at   timestamptz not null default now()
);
create index if not exists idx_clicks_code on referral_clicks(code);

-- ---------- referrals (a user attributed to a partner — first touch wins) ----------
create table if not exists referrals (
  id                 uuid primary key default gen_random_uuid(),
  partner_id         uuid not null references partners(id) on delete cascade,
  referred_user_id   text,                       -- your app user id (once known)
  stripe_customer_id text,                        -- Stripe customer (once known)
  attributed_via     text not null check (attributed_via in ('link','coupon')),
  status             text not null default 'pending' check (status in ('pending','active','churned')),
  created_at         timestamptz not null default now(),
  unique (referred_user_id)                        -- one partner per referred user (first touch)
);
create unique index if not exists idx_ref_customer on referrals(stripe_customer_id) where stripe_customer_id is not null;
create index if not exists idx_ref_partner on referrals(partner_id);

-- ---------- commissions (credited only on real paid invoices) ----------
create table if not exists commissions (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references partners(id) on delete cascade,
  referral_id       uuid references referrals(id) on delete set null,
  stripe_invoice_id text unique,                  -- idempotency: one commission per invoice
  stripe_charge_id  text,
  gross_cents       integer not null,             -- what the customer paid (cents)
  rate              numeric(5,2) not null,         -- e.g. 15.00
  commission_cents  integer not null,
  kind              text not null check (kind in ('first','recurring')),
  status            text not null default 'pending' check (status in ('pending','available','paid','reversed')),
  available_at      timestamptz,                   -- pending -> available after the refund hold
  created_at        timestamptz not null default now()
);
create index if not exists idx_comm_partner on commissions(partner_id);
create index if not exists idx_comm_status on commissions(status);

-- ---------- payouts ----------
create table if not exists payouts (
  id                 uuid primary key default gen_random_uuid(),
  partner_id         uuid not null references partners(id) on delete cascade,
  amount_cents       integer not null,
  stripe_transfer_id text,
  status             text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at         timestamptz not null default now()
);

-- ---------- stripe_events (webhook idempotency) ----------
create table if not exists stripe_events (
  id         text primary key,     -- Stripe event id
  type       text,
  created_at timestamptz not null default now()
);

-- ---------- tiers (commission ladder — based on total referred revenue) ----------
create table if not exists affiliate_tiers (
  level          int primary key,
  name           text not null,
  threshold_cents integer not null,   -- total referred revenue needed
  rate           numeric(5,2) not null
);

insert into affiliate_tiers (level,name,threshold_cents,rate) values
  (1,'Starter',       0,      15.00),
  (2,'Bronze',     10000,     17.00),
  (3,'Silver',     25000,     18.00),
  (4,'Gold',       50000,     20.00),
  (5,'Platinum',  100000,     22.00),
  (6,'Diamond',   250000,     24.00),
  (7,'Elite',     500000,     26.00),
  (8,'Champion', 1000000,     28.00),
  (9,'Legend',   2500000,     30.00)
on conflict (level) do update
  set name=excluded.name, threshold_cents=excluded.threshold_cents, rate=excluded.rate;

-- ---------- helper: total referred revenue (paid, non-reversed) for a partner ----------
create or replace function partner_revenue_cents(p_partner uuid)
returns integer language sql stable as $$
  select coalesce(sum(gross_cents),0)::int
  from commissions
  where partner_id = p_partner and status <> 'reversed';
$$;

-- ---------- helper: current tier (rate + level) for a revenue amount ----------
create or replace function tier_for_revenue(p_cents integer)
returns affiliate_tiers language sql stable as $$
  select * from affiliate_tiers
  where threshold_cents <= p_cents
  order by level desc limit 1;
$$;

-- ---------- leaderboard (current calendar month, paid+available+pending) ----------
create or replace view leaderboard_monthly as
  select
    p.id as partner_id,
    case when p.hide_username then 'Hidden' else coalesce(p.display_name, p.code) end as name,
    p.show_on_leaderboard,
    coalesce(sum(c.commission_cents) filter (
      where c.created_at >= date_trunc('month', now()) and c.status <> 'reversed'
    ),0)::int as month_cents
  from partners p
  left join commissions c on c.partner_id = p.id
  group by p.id;

-- ============================================================================
-- Row Level Security
-- The FastAPI backend uses the SERVICE ROLE key (bypasses RLS), so all writes
-- go through it. Lock the tables to the backend; if you later expose Supabase
-- directly to the client, add policies keyed to your auth (auth.uid() = user_id).
-- ============================================================================
alter table partners        enable row level security;
alter table referrals       enable row level security;
alter table commissions     enable row level security;
alter table payouts         enable row level security;
alter table referral_clicks enable row level security;

-- Policies for the IN-SITE dashboard (browser uses the anon key + Supabase Auth).
-- A partner can see/manage only their own rows; money rows are read-only to them
-- (only the service-role edge functions write commissions/payouts).
create policy partners_self on partners
  for select using (auth.uid()::text = user_id);
create policy partners_insert on partners
  for insert with check (auth.uid()::text = user_id);
create policy partners_update on partners
  for update using (auth.uid()::text = user_id);

create policy referrals_self on referrals
  for select using (exists (select 1 from partners p where p.id = referrals.partner_id and p.user_id = auth.uid()::text));
create policy commissions_self on commissions
  for select using (exists (select 1 from partners p where p.id = commissions.partner_id and p.user_id = auth.uid()::text));
create policy payouts_self on payouts
  for select using (exists (select 1 from partners p where p.id = payouts.partner_id and p.user_id = auth.uid()::text));

-- anyone may log a referral click (no read)
create policy clicks_insert on referral_clicks for insert with check (true);

-- leaderboard view is exposed read-only (it already hides opted-out / hidden names)
grant select on leaderboard_monthly to anon, authenticated;
grant select on affiliate_tiers to anon, authenticated;

