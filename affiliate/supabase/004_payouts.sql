-- ============================================================================
-- 004_payouts.sql — finalize the payout system (safe to re-run / idempotent)
-- Run AFTER 003_affiliate.sql in the Supabase SQL editor.
-- Money is in integer CENTS everywhere.
-- ============================================================================

-- ---------- commissions: link to a payout + currency + clawback flag ----------
alter table commissions add column if not exists payout_id       uuid references payouts(id) on delete set null;
alter table commissions add column if not exists currency        text not null default 'usd';
alter table commissions add column if not exists clawback_needed boolean not null default false;
create index if not exists idx_comm_payout on commissions(payout_id);

-- ---------- payouts: currency + paid_at + error ----------
alter table payouts add column if not exists currency      text not null default 'usd';
alter table payouts add column if not exists paid_at       timestamptz;
alter table payouts add column if not exists error_message text;

-- ---------- clawback adjustments ----------
-- When a refund hits an ALREADY-PAID commission we never auto-pull money from
-- the partner. We log a negative adjustment row instead (settled manually / by
-- netting against future commissions).
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

-- ---------- release_commissions(hold_days): pending -> available ----------
-- Becomes available only after created_at + hold_days, still 'pending', and
-- not flagged for clawback. Driven by hold_days (the Edge Function passes
-- PAYOUT_HOLD_DAYS) so changing the env takes effect immediately — it does NOT
-- rely on the available_at baked in at creation time.
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

-- allow the service role (edge functions) to call it
grant execute on function release_commissions(integer) to service_role;
