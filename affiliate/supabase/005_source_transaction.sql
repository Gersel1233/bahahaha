-- ============================================================================
-- 005_source_transaction.sql — per-commission Connect transfers
-- Run AFTER 004_payouts.sql. Safe to run on an existing DB and safe to re-run.
-- ============================================================================

-- Each commission gets its own transfer id (one Stripe transfer per commission,
-- created with source_transaction = stripe_charge_id).
alter table commissions add column if not exists stripe_transfer_id text;
create index if not exists idx_comm_transfer on commissions(stripe_transfer_id);

-- payout_ready: a commission can only be paid via source_transaction when it is
-- tied to a real charge id (ch_...). A payment_intent (pi_...) is resolved to its
-- latest_charge at payout time, after which this flag flips to true automatically.
-- (Generated/STORED so it always reflects stripe_charge_id with no app logic.)
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'commissions' and column_name = 'payout_ready'
  ) then
    alter table commissions
      add column payout_ready boolean
      generated always as (stripe_charge_id is not null and starts_with(stripe_charge_id, 'ch_')) stored;
  end if;
end $$;
