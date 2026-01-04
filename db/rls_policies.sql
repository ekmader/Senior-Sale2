-- RLS policies for Senrio Sale

-- Enable RLS where appropriate
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_memberships ENABLE ROW LEVEL SECURITY;

-- profiles: allow users to SELECT/UPDATE only their own profile
CREATE POLICY "profiles_select_self" ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- items: allow insert if auth.uid() matches user_id and university_id equals user's profile
CREATE POLICY "items_insert_own" ON items FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL) AND
    (NEW.user_id = auth.uid()) AND
    (EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.university_id = NEW.university_id
    ))
  );

-- items: allow select only for users in the same university
CREATE POLICY "items_select_same_university" ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.university_id = items.university_id
    )
  );

-- items: allow update/delete only by the owner
CREATE POLICY "items_modify_owner" ON items FOR UPDATE, DELETE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- groups: allow select for users in same university
CREATE POLICY "groups_select_university" ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.university_id = groups.university_id
    )
  );

-- group_memberships: allow members to see their own memberships
CREATE POLICY "memberships_select" ON group_memberships FOR SELECT
  USING (user_id = auth.uid());

-- Admin role notes: create a separate `admins` table or role with policies to allow content moderation.

-- End of RLS policies
