/*
# Add state_data column to app_state

1. Modified Tables
- `app_state`: added `state_data` (jsonb, nullable) column to store the full
  serialized app profile (missions, bills, goals, loot, timer, etc.).
2. Security
- No policy changes. The table already has RLS enabled with anon/authenticated
  CRUD policies (single-tenant, no auth).
3. Notes
- The column is nullable so existing rows are unaffected.
- The frontend will read/write this column on load to sync the full profile.
*/

ALTER TABLE app_state
  ADD COLUMN IF NOT EXISTS state_data jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON app_state TO anon, authenticated;
