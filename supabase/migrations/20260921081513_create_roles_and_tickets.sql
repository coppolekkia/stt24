/*
# Create roles and tickets tables for Stt24 daily log app

1. New Tables
- `roles`: Stores user role assignments (admin, writer, viewer). Columns: user_id (uuid, references auth.users), role (text), email (text), updated_at (bigint).
- `tickets`: Daily log entries. Columns: id (uuid), titolo, priorita, tipo_evento, data_ora, risorsa, edificio, postazione, descrizione, note, user_id (uuid), created_at (timestamptz).

2. Helper Functions (SECURITY DEFINER)
- `is_admin()`: Returns true if current user has admin role. Bypasses RLS to avoid recursion.
- `is_writer()`: Returns true if current user is admin or writer.
- `is_viewer()`: Returns true if current user is admin, writer, or viewer.

3. Security (RLS)
- `roles`: Users can read their own role; admins can read/write all roles.
- `tickets`: Viewers+ can read all; writers+ can create (own only); writers+ can update own; admin or owner can delete.

4. Important Notes
- Role checks use SECURITY DEFINER functions to avoid RLS recursion on the roles table.
- Tickets user_id defaults to auth.uid() so inserts omitting it still pass RLS.
- created_at defaults to now() so inserts omitting it still pass RLS.
*/

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'writer', 'viewer')),
  email text NOT NULL,
  updated_at bigint DEFAULT (extract(epoch from now()) * 1000)::bigint
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titolo text DEFAULT '',
  priorita text DEFAULT 'Bassa',
  tipo_evento text DEFAULT '',
  data_ora text DEFAULT '',
  risorsa text DEFAULT '',
  edificio text DEFAULT '',
  postazione text DEFAULT '',
  descrizione text NOT NULL,
  note text DEFAULT '',
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to bypass RLS and avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_writer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'writer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_viewer()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.roles
    WHERE user_id = auth.uid() AND role IN ('admin', 'writer', 'viewer')
  );
$$;

-- Roles policies
DROP POLICY IF EXISTS "select_roles" ON roles;
CREATE POLICY "select_roles" ON roles FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_roles" ON roles;
CREATE POLICY "insert_roles" ON roles FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "update_roles" ON roles;
CREATE POLICY "update_roles" ON roles FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "delete_roles" ON roles;
CREATE POLICY "delete_roles" ON roles FOR DELETE
  TO authenticated USING (is_admin());

-- Tickets policies
DROP POLICY IF EXISTS "select_tickets" ON tickets;
CREATE POLICY "select_tickets" ON tickets FOR SELECT
  TO authenticated USING (is_viewer());

DROP POLICY IF EXISTS "insert_tickets" ON tickets;
CREATE POLICY "insert_tickets" ON tickets FOR INSERT
  TO authenticated WITH CHECK (is_writer() AND user_id = auth.uid());

DROP POLICY IF EXISTS "update_tickets" ON tickets;
CREATE POLICY "update_tickets" ON tickets FOR UPDATE
  TO authenticated USING (is_writer() AND user_id = auth.uid())
  WITH CHECK (is_writer() AND user_id = auth.uid());

DROP POLICY IF EXISTS "delete_tickets" ON tickets;
CREATE POLICY "delete_tickets" ON tickets FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

-- Index for tickets ordering
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);
