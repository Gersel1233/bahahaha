-- ============================================================================
-- 007_waitlist.sql — early-access / waitlist capture for the marketing site
-- Run in the Supabase SQL editor. Safe to run on a fresh DB and safe to re-run
-- on an existing DB (idempotent: create-if-not-exists + add-column-if-not-exists).
-- ============================================================================

create extension if not exists pgcrypto;

-- Fresh installs get the canonical shape directly.
create table if not exists waitlist (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  name          text,
  use_case      text,
  referral_code text,                       -- referral code present at signup (if any)
  source        text default 'marketing_site',
  created_at    timestamptz not null default now()
);

-- Upgrade path for older waitlist tables (which used ref_code / user_agent):
-- add the new columns if they are missing, and backfill referral_code.
alter table waitlist add column if not exists name          text;
alter table waitlist add column if not exists use_case      text;
alter table waitlist add column if not exists referral_code text;
alter table waitlist add column if not exists source        text default 'marketing_site';
alter table waitlist add column if not exists created_at     timestamptz not null default now();
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name='waitlist' and column_name='ref_code') then
    update waitlist set referral_code = coalesce(referral_code, ref_code);
  end if;
end $$;

-- One row per email (case-insensitive). Insert collisions surface as 23505,
-- which the join-waitlist function treats as "already on the list".
create unique index if not exists idx_waitlist_email on waitlist (lower(email));

-- RLS: the list is write-only from the public internet and never readable by
-- anon/authenticated. Reads happen only through the service role (admin /
-- join-waitlist Edge Function), which bypasses RLS.
alter table waitlist enable row level security;

-- Allow anonymous INSERT (defensive fallback for a direct client insert). No
-- SELECT / UPDATE / DELETE policy exists, so the list cannot be read publicly.
do $$ begin
  if not exists (select 1 from pg_policies where tablename='waitlist' and policyname='waitlist_insert') then
    create policy waitlist_insert on waitlist for insert with check (true);
  end if;
end $$;

grant insert on waitlist to anon, authenticated;
