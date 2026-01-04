-- Groups, join requests, admins and moderation schema

-- Add a group_id to items to allow posts targeted to groups
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES groups(id) ON DELETE SET NULL;

-- Add banned flag to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- Admins table: grants moderation permission per university or global
CREATE TABLE IF NOT EXISTS admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  university_id uuid REFERENCES universities(id) ON DELETE CASCADE,
  role text CHECK (role IN ('moderator','admin')) DEFAULT 'moderator',
  created_at timestamptz DEFAULT now(),
  UNIQUE (profile_id, university_id)
);

-- Join requests table for private groups
CREATE TABLE IF NOT EXISTS group_join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  message text,
  status text CHECK (status IN ('pending','accepted','rejected')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Ensure groups have privacy set and index
ALTER TABLE groups
  ALTER COLUMN privacy SET DEFAULT 'public';

CREATE INDEX IF NOT EXISTS groups_university_idx ON groups (university_id);

-- Grant privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE admins TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE group_join_requests TO authenticated;

-- Functions for group flows and moderation

-- Create group (only for authenticated users)
create or replace function public.create_group(p_university uuid, p_name text, p_privacy text, p_creator uuid) returns uuid language plpgsql as $$
declare
  g_id uuid;
begin
  insert into groups (university_id, name, privacy) values (p_university, p_name, p_privacy) returning id into g_id;
  -- Add creator as member and as admin of the group (role: member)
  insert into group_memberships (group_id, user_id, role) values (g_id, p_creator, 'member');
  return g_id;
end;
$$;

grant execute on function public.create_group(uuid, text, text, uuid) to authenticated;

-- Request to join group
create or replace function public.request_join_group(p_group uuid, p_user uuid, p_message text) returns void language plpgsql as $$
begin
  insert into group_join_requests (group_id, user_id, message) values (p_group, p_user, p_message) on conflict (group_id, user_id) do update set status = 'pending', message = excluded.message, created_at = now();
end;
$$;

grant execute on function public.request_join_group(uuid, uuid, text) to authenticated;

-- Accept or reject join request (must be group member with role 'member' or moderator/admin of university)
create or replace function public.respond_join_request(p_request uuid, p_accept boolean) returns void language plpgsql as $$
declare
  req record;
  is_allowed boolean := false;
begin
  select * into req from group_join_requests where id = p_request;
  if req is null then raise exception 'Request not found'; end if;

  -- Check if caller is group moderator/admin or university admin
  if exists(select 1 from group_memberships gm where gm.group_id = req.group_id and gm.user_id = auth.uid() and gm.role in ('member','admin')) then is_allowed := true; end if;
  if exists(select 1 from admins a where a.university_id = (select university_id from groups where id = req.group_id) and a.profile_id = auth.uid()) then is_allowed := true; end if;
  if not is_allowed then raise exception 'Not authorized'; end if;

  if p_accept then
    update group_join_requests set status = 'accepted' where id = p_request;
    insert into group_memberships (group_id, user_id, role) values (req.group_id, req.user_id, 'member') on conflict do nothing;
  else
    update group_join_requests set status = 'rejected' where id = p_request;
  end if;
end;
$$;

grant execute on function public.respond_join_request(uuid, boolean) to authenticated;

-- Admin moderation functions
-- Only allow the creator or an admin to mark items as inactive
create or replace function public.admin_remove_item(p_item uuid) returns void language plpgsql as $$
declare
  it record;
  allowed boolean := false;
begin
  select * into it from items where id = p_item;
  if it is null then raise exception 'Item not found'; end if;

  -- allow if you're the item's owner
  if it.user_id = auth.uid() then allowed := true; end if;

  -- allow if you're admin for the university
  if exists(select 1 from admins a where a.profile_id = auth.uid() and a.university_id = it.university_id) then allowed := true; end if;

  if not allowed then raise exception 'Not authorized'; end if;

  update items set is_active = false where id = p_item;
end;
$$;

grant execute on function public.admin_remove_item(uuid) to authenticated;

-- Ban/unban user (only admin)
create or replace function public.admin_set_user_banned(p_user uuid, p_banned boolean) returns void language plpgsql as $$
begin
  if not exists(select 1 from admins a where a.profile_id = auth.uid() and a.university_id = (select university_id from profiles where id = p_user)) then
    raise exception 'Not authorized';
  end if;
  update profiles set is_banned = p_banned where id = p_user;
end;
$$;

grant execute on function public.admin_set_user_banned(uuid, boolean) to authenticated;

-- Mark report status
create or replace function public.admin_update_report(p_report uuid, p_status text) returns void language plpgsql as $$
begin
  if not exists(select 1 from admins a where a.profile_id = auth.uid()) then
    raise exception 'Not authorized';
  end if;
  update reports set status = p_status where id = p_report;
end;
$$;

grant execute on function public.admin_update_report(uuid, text) to authenticated;

-- Fetch group items RPC (only returns visible items according to membership and privacy)
create or replace function public.get_group_items(p_group uuid, p_limit int, p_offset int) returns setof items language sql stable as $$
  select it.* from items it
  join groups g on g.id = p_group
  where it.group_id = p_group and it.is_active
    and (
      g.privacy = 'public'
      or exists(select 1 from group_memberships gm where gm.group_id = g.id and gm.user_id = auth.uid())
      or exists(select 1 from admins a where a.profile_id = auth.uid() and a.university_id = g.university_id)
    )
  order by created_at desc limit coalesce(p_limit, 30) offset coalesce(p_offset, 0);
$$;

grant execute on function public.get_group_items(uuid, int, int) to authenticated;

-- Return groups that are public in the university or where the user is a member
create or replace function public.get_public_or_member_groups(p_university uuid, p_user uuid) returns setof groups language sql stable as $$
  select * from groups g
  where g.university_id = p_university
    and (g.privacy = 'public' or exists(select 1 from group_memberships gm where gm.group_id = g.id and gm.user_id = p_user))
  order by created_at desc;
$$;

grant execute on function public.get_public_or_member_groups(uuid, uuid) to authenticated;

-- End of groups & moderation schema
