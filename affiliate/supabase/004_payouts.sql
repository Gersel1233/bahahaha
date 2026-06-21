-- ============================================================================
-- 004_payouts.sql — finalize the payout system
-- Safe to run on an existing database and safe to re-run (idempotent).
-- Assumes 003_affiliate.sql created the CORE tables (partners, commissions).
-- This file guarantees `payouts` exists BEFORE anything references it, so
-- ordering can never bite even if 003 was partial.
-- Money is in integer CENTS everywhere.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1) payouts — created FIRST so the FK from commissions.payout_id is valid.
--    Full definition (matches 003) PLUS the new columns. If 003 already made
--    this table, `create table if not exists` is a no-op and the alters below
--    backfill the new columns.
-- ---------------------------------------------------------------------------
create table if not exists payouts (
  id                 uuid primary key default gen_random_uuid(),
  partner_id         uuid not null references partners(id) on delete cascade,
  amount_cents       integer not null,
  currency           text not null default 'usd',
  stripe_transfer_id text,
  status             text not null default 'pending' check (status in ('pending','paid','failed')),
  error_message      text,
  created_at         timestamptz not null default now(),
  paid_at            timestamptz
);
-- backfill columns onto a pre-existing 003 payouts table
alter table payouts add column if not exists currency      text not null default 'usd';
alter table payouts add column if not exists error_message text;
alter table payouts add column if not exists paid_at       timestamptz;

create index if not exists idx_payouts_partner on payouts(partner_id);

alter table payouts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='payouts' and policyname='payouts_self') then
    create policy payouts_self on payouts
      for select using (exists (select 1 from partners p where p.id = payouts.partner_id and p.user_id = auth.uid()::text));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2) commissions — link to a payout + currency + clawback flag.
--    payouts now exists, so the foreign key resolves cleanly.
-- ---------------------------------------------------------------------------
alter table commissions add column if not exists payout_id       uuid references payouts(id) on delete set null;
alter table commissions add column if not exists currency        text not null default 'usd';
alter table commissions add column if not exists clawback_needed boolean not null default false;
create index if not exists idx_comm_payout on commissions(payout_id);

-- ---------------------------------------------------------------------------
-- 3) commission_adjustments — clawback log.
--    When a refund hits an ALREADY-PAID commission we never auto-pull money
--    from the partner; we record a negative adjustment row instead.
-- ---------------------------------------------------------------------------
create table if not exists commission_adjustments (
  id                uuid primary key default gen_random_uuid(),
  partner_id        uuid not null references partners(id) on delete cascade,
  commission_id     uuid references commissions(id) on delete set null,
  amount_cents      integer not null,            -- negative = partner owes it back
  reason            text,
  stripe_charge_id  text,
  resolved          boolean not null default false,
  created_at        timestamptz not null default now()
);
create index if not exists idx_adj_partner on commission_adjustments(partner_id);

alter table commission_adjustments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename='commission_adjustments' and policyname='adj_self') then
    create policy adj_self on commission_adjustments
      for select using (exists (select 1 from partners p where p.id = commission_adjustments.partner_id and p.user_id = auth.uid()::text));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 4) release_commissions(hold_days): pending -> available.
--    Eligible once created_at + hold_days has passed, still 'pending', and not
--    flagged for clawback. Driven by hold_days (the edge function passes
--    PAYOUT_HOLD_DAYS) so changing the env takes effect immediately — it does
--    NOT depend on the available_at baked in at creation time.
-- ---------------------------------------------------------------------------
create or replace function release_commissions(hold_days integer default 30)
returns integer language plpgsql security definer as $$
declare n integer;
begin
  update commissions
     set status = 'available',
         available_at = least(coalesce(available_at, now()), now())
   where status = 'pending'
     and clawback_needed = false
     and created_at + (hold_days || ' days')::interval <= now();
  get diagnostics n = row_count;
  return n;
end $$;

-- let the service role (edge functions) call it
grant execute on function release_commissions(integer) to service_role;
