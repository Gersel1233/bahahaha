-- ============================================================================
-- 009_push_notifications.sql — admin-only Web Push subscriptions (PWA alerts)
-- ADDITIVE. Does NOT touch the money tables (partners/referrals/commissions/
-- payouts/stripe_events). Stores the OWNER's push subscriptions (phone + laptop)
-- so a new-application webhook can notify them. Locked at the DATA layer to the
-- admin email only — any other signed-in partner gets ZERO rows and cannot write,
-- even if they call PostgREST directly.
-- Run in the Supabase SQL editor AFTER 003–008.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists push_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    text not null,
  endpoint   text unique not null,        -- the browser push endpoint (one per device)
  p256dh     text not null,               -- subscription public key
  auth       text not null,               -- subscription auth secret
  ua         text,                        -- which device (user agent), for your reference
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

-- Table privileges (RLS still restricts WHICH rows — see the policy below).
grant select, insert, update, delete on push_subscriptions to authenticated;

-- ADMIN-ONLY at the data layer: only mikkelgersel16@gmail.com's JWT may touch this
-- table. Regular partners get nothing. The send-push Edge Function uses the service
-- role, which bypasses RLS, so it can still read every subscription to fan out.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='push_subscriptions' and policyname='push_admin_only') then
    create policy push_admin_only on push_subscriptions
      for all
      using      ((auth.jwt() ->> 'email') = 'mikkelgersel16@gmail.com')
      with check ((auth.jwt() ->> 'email') = 'mikkelgersel16@gmail.com');
  end if;
end $$;
