/*
# Create app_state table (single-tenant, no auth)

1. New Tables
- `app_state`: one row per app profile holding the entire Quartel General
  state as a single JSON document so the app restores across devices/clears.
  - `profile_id` (text, primary key): app profile identifier ("default").
  - `data` (jsonb, not null): full serialized app state (missions, timer, PA,
    treasury, loot, goals, bills, drawn mission of the day, history).
  - `updated_at` (timestamptz): last write timestamp.

2. Security
- Enable RLS on `app_state`.
- Single-tenant app with no sign-in: policies scoped `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)`, intentional because the data is
  shared single-user state with no ownership concept.
- Four separate policies (select/insert/update/delete); DELETE policy exists
  for completeness but no DELETE grant: rows are only selected/inserted/updated.

3. Notes
- The frontend upserts via POST with `Prefer: resolution=merge-duplicates`,
  which inserts or updates on the `profile_id` primary key.
- Complements `focus_sessions` (append-only session mirror).
*/

CREATE TABLE IF NOT EXISTS app_state (
  profile_id text PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON app_state TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
CREATE POLICY "anon_select_app_state"
ON app_state FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
CREATE POLICY "anon_insert_app_state"
ON app_state FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
CREATE POLICY "anon_update_app_state"
ON app_state FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_state" ON app_state;
CREATE POLICY "anon_delete_app_state"
ON app_state FOR DELETE
TO anon, authenticated USING (true);
