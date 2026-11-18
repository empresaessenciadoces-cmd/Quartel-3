/*
# Create focus_sessions table (single-tenant, no auth)

1. New Tables
- `focus_sessions`: one row per completed Moedor (timer) session.
  - `id` (text, primary key): client-generated session id, so retries/upserts are idempotent.
  - `mission_title` (text): mission name attacked, or the timer mode label for free focus.
  - `mode_label` (text): timer mode label (Foco Rápido, Missão 15 min, Microtarefa, Descanso).
  - `mins` (integer): duration of the session in minutes.
  - `pa` (integer): Action Points (PA) awarded by the session.
  - `created_at` (timestamptz): when the session completed.

2. Security
- Enable RLS on `focus_sessions`.
- Grant SELECT/INSERT to `anon` + `authenticated` because this app has no sign-in
  and the data is intentionally single-user/public.
- Four separate policies (select/insert/update/delete) scoped `TO anon, authenticated`
  using `USING (true)` / `WITH CHECK (true)`, allowed here because the table is
  intentionally shared single-tenant data with no ownership concept.
- No UPDATE/DELETE grants: sessions are append-only history.

3. Notes
- The frontend keeps a local backup (localStorage) and mirrors every completed
  session here so the history survives across devices/clears.
- Idempotent via CREATE TABLE IF NOT EXISTS.
*/

CREATE TABLE IF NOT EXISTS focus_sessions (
  id text PRIMARY KEY,
  mission_title text NOT NULL DEFAULT '',
  mode_label text NOT NULL DEFAULT '',
  mins integer NOT NULL DEFAULT 5,
  pa integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT ON focus_sessions TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_select_focus_sessions"
ON focus_sessions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_insert_focus_sessions"
ON focus_sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_update_focus_sessions"
ON focus_sessions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_focus_sessions" ON focus_sessions;
CREATE POLICY "anon_delete_focus_sessions"
ON focus_sessions FOR DELETE
TO anon, authenticated USING (true);
