-- ============================================================================
-- 008_partner_vetting.sql — partner APPLICATION + approval gate
-- ADDITIVE. Does NOT touch commissions / payouts / the Stripe webhook.
-- The gate: a partner is created as status='pending' and only an owner (via the
-- service-role `partner-review` edge function) can flip it to 'approved'. The
-- dashboard only reveals the code/link once approved — commissions are minted
-- exactly as before, unchanged.
-- Run in the Supabase SQL editor AFTER 003–007.
-- ============================================================================

-- ---------- application fields + status ----------
alter table partners add column if not exists content_type           text;   -- what they create (fitness/beauty/…)
alter table partners add column if not exists handle                 text;   -- their @handle on the platform
alter table partners add column if not exists guidelines_accepted_at timestamptz;
alter table partners add column if not exists status                 text;   -- pending | approved | rejected
-- (platform reuses the existing promo_channel column)

-- The referral code is now assigned by the OWNER on approval (partner-review), not
-- at apply time — so a pending applicant literally has no code and cannot refer or
-- earn before approval. Allow code to be null while pending. (unique still holds;
-- Postgres treats NULLs as distinct, so many pending rows can coexist.)
alter table partners alter column code drop not null;

-- Grandfather everyone who ALREADY exists — they are live, already-vetted
-- partners and must stay active. New rows get 'pending' via the default below.
update partners set status = 'approved' where status is null;

alter table partners alter column status set default 'pending';
alter table partners alter column status set not null;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'partners_status_chk') then
    alter table partners add constraint partners_status_chk check (status in ('pending','approved','rejected'));
  end if;
end $$;

create index if not exists idx_partners_status on partners(status);

-- ============================================================================
-- Data-layer status gate (the real gate)
-- The browser uses the anon key + the user's JWT → Postgres role `authenticated`.
-- RLS already limits WHICH rows a partner can touch (their own). These COLUMN
-- grants limit WHICH columns they may write: they can file their own application
-- and edit cosmetic fields, but can NEVER set/alter `status`, `code`,
-- `payout_enabled` or the stripe ids — so a pending applicant cannot self-approve.
-- The service role (edge functions) bypasses these grants, so `partner-review`
-- (approve/reject) and the Stripe-connect functions keep working.
-- ============================================================================
grant select on partners to authenticated;
revoke insert, update on partners from authenticated;
grant insert (user_id, promo_channel, content_type, handle, guidelines_accepted_at)
  on partners to authenticated;
grant update (show_on_leaderboard, hide_username, promo_channel, display_name, content_type, handle)
  on partners to authenticated;
