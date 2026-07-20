-- ============================================================================
-- 010_partner_code_from_handle.sql — case-insensitive uniqueness for partner codes
-- ADDITIVE. Partner codes are now DERIVED from the applicant's social handle on
-- approval (see the partner-review Edge Function), e.g. @m.gersel → m-gersel.
-- This index makes the "is it taken?" check reliable and blocks case-variant
-- collisions at the DB level — a shared code would misattribute commissions.
-- Money-table logic untouched. Run in the SQL editor AFTER 003–009.
-- ============================================================================

-- Case-insensitive uniqueness on the referral code. Partial, because `code` is
-- nullable (pending applicants have no code yet). The existing case-sensitive
-- `unique` from 003 stays; this adds the lower() guarantee on top.
create unique index if not exists partners_code_lower_uniq
  on partners (lower(code)) where code is not null;
