-- ============================================================================
-- 007_waitlist.sql — early-access waitlist capture
-- Run in the Supabase SQL editor. Safe to run on an existing DB / re-run.
-- ============================================================================

create extension if not exists pgcrypto;

create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  email       text not null,
  use_case    text,
  ref_code    text,                       -- referral code present at signup (if any)
  user_agent  text,
  created_at  timestamptz not null default now()
);
-- one row per email (case-insensitive)
create unique index if not exists idx_waitlist_email on waitlist (lower(email));

alter table waitlist enable row level security;

-- Anyone may JOIN (insert only). No public read — the list is read via the
-- service role (admin) only. A duplicate email hits the unique index and the
-- client treats that as "already on the list".
do $$ begin
  if not exists (select 1 from pg_policies where tablename='waitlist' and policyname='waitlist_insert') then
    create policy waitlist_insert on waitlist for insert with check (true);
  end if;
end $$;

grant insert on waitlist to anon, authenticated;
