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

-- items: allow select only for users in the same university and respect group privacy
CREATE POLICY "items_select_same_university_and_group" ON items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.university_id = items.university_id
    )
    AND (
      -- If item not targeted to a group, it's visible to anyone in the university
      items.group_id IS NULL
      OR
      -- If targeted to a group, it's visible only when:
      (
        -- group is public
        exists(select 1 from groups g where g.id = items.group_id and g.privacy = 'public')
        -- or user is a member of the group
        OR exists(select 1 from group_memberships gm where gm.group_id = items.group_id and gm.user_id = auth.uid())
        -- or user is an admin for the university
        OR exists(select 1 from admins a where a.profile_id = auth.uid() and a.university_id = items.university_id)
      )
    )
  );

-- items: allow update/delete only by the owner
CREATE POLICY "items_modify_owner" ON items FOR UPDATE, DELETE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- group_memberships: allow select for members to view memberships
CREATE POLICY "memberships_select" ON group_memberships FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM admins a WHERE a.profile_id = auth.uid() AND a.university_id = (SELECT university_id FROM groups g WHERE g.id = group_memberships.group_id)));

-- group_join_requests: allow users to insert their own requests, and allow group admins or university admins to select
CREATE POLICY "join_requests_insert_own" ON group_join_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "join_requests_select_admins" ON group_join_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM group_memberships gm WHERE gm.group_id = group_join_requests.group_id AND gm.user_id = auth.uid() AND gm.role IN ('member','admin'))
    OR EXISTS (SELECT 1 FROM admins a WHERE a.profile_id = auth.uid() AND a.university_id = (SELECT university_id FROM groups g WHERE g.id = group_join_requests.group_id))
  );

CREATE POLICY "join_requests_update_admins" ON group_join_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM group_memberships gm WHERE gm.group_id = group_join_requests.group_id AND gm.user_id = auth.uid() AND gm.role IN ('member','admin'))
    OR EXISTS (SELECT 1 FROM admins a WHERE a.profile_id = auth.uid() AND a.university_id = (SELECT university_id FROM groups g WHERE g.id = group_join_requests.group_id))
  ) WITH CHECK (status IN ('pending','accepted','rejected'));

-- admins: allow select for university admins and allow inserts only via RPC or server-side flows
CREATE POLICY "admins_select_university" ON admins FOR SELECT
  USING (profile_id = auth.uid() OR EXISTS (SELECT 1 FROM admins a2 WHERE a2.profile_id = auth.uid()));

-- reports: allow authenticated users to insert reports and view their own reports
CREATE POLICY "reports_insert_auth" ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "reports_select_own_or_admin" ON reports FOR SELECT
  USING (reporter_id = auth.uid() OR EXISTS (SELECT 1 FROM admins a WHERE a.profile_id = auth.uid() AND a.university_id = (SELECT university_id FROM items i WHERE i.id = reports.item_id)));

CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM admins a WHERE a.profile_id = auth.uid()))
  WITH CHECK (status IN ('open','reviewed','dismissed'));


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
