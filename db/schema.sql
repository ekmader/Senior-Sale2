-- Senrio Sale DB schema (Postgres)

-- Extension for functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Universities table (one row per institution)
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text NOT NULL UNIQUE, -- e.g. mit.edu
  created_at timestamptz DEFAULT now()
);

-- Profiles (linked to Supabase Auth users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY, -- matches auth.uid()
  email text NOT NULL UNIQUE,
  name text,
  university_id uuid REFERENCES universities(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Items posted by users
CREATE TABLE IF NOT EXISTS items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES universities(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price numeric(9,2),
  category text,
  image_path text, -- supabase storage path
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS items_university_idx ON items (university_id, created_at DESC);

-- Groups and memberships
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES universities(id) ON DELETE CASCADE,
  name text NOT NULL,
  privacy text CHECK (privacy IN ('public','private')) DEFAULT 'public',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Reports for moderation
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES items(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reason text,
  status text CHECK (status IN ('open','reviewed','dismissed')) DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

-- Insert a couple of example universities (edit as needed)
INSERT INTO universities (name, domain) VALUES ('Example University','example.edu') ON CONFLICT (domain) DO NOTHING;

-- Notes:
-- Supabase maintains the auth.users table separately. Use triggers or Supabase Functions to sync auth.users -> profiles on sign-up.
