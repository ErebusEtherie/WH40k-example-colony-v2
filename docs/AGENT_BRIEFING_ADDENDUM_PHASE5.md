# ⚠️ RETIRED — Do Not Use

**Status:** Retired 2026-08-23. This file is intentionally kept as a stub so
that if it still exists on disk, an agent opening it is redirected rather than
silently trusting stale content.

**Reason:** This document's Personality table, Colony Size → Profit Factor
table, and State Thresholds table were checked against the confirmed rulebook
source and against other project documents and found to be **fabricated /
contradictory**:

- Personality names and effects did not match the rulebook source text (18 of
  21 listed traits do not exist in the source material).
- The Colony Size → Profit Factor table used range-buckets, contradicting the
  per-size lookup table confirmed in four other documents.
- The State Thresholds table used `stat > 0` conditions for Productive/Pious,
  contradicting the confirmed `stat > actual_size` rule used everywhere else.

**What to use instead:**

- Personality mechanics, Hard Infrastructure reference data, `chosen_stat` /
  `mad_order_roll` lifecycle rules, and the implementation checklist: see
  **`implementation_plan_phase_5.md`**.
- Colony Size → Profit Factor table: see `business_analysis.md` §4.5 or
  `config/rule_tables.yaml` (canonical, per-size lookup).
- Lore state thresholds: see `business_analysis.md` §4.4 or
  `UI_PANEL_REQUIREMENTS.md`.

This file can be deleted once you've confirmed nothing else links to it; it is
kept only as a safety redirect in the interim. See `CONSOLIDATION_SUMMARY.md`
for the corrected removal record.
