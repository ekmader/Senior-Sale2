-- RPC for inserting items with simple rate-limiting
create or replace function public.insert_item(
  p_user uuid,
  p_university uuid,
  p_title text,
  p_price numeric,
  p_category text,
  p_image_path text,
  p_group uuid
) returns uuid language plpgsql as $$
declare
  recent_count int;
  new_id uuid;
begin
  -- Basic rate limit: max 8 posts per hour
  select count(*) into recent_count from items where user_id = p_user and created_at > now() - interval '1 hour';
  if recent_count >= 8 then
    raise exception 'Rate limit exceeded: maximum 8 posts per hour';
  end if;

  insert into items (user_id, university_id, title, price, category, image_path, group_id)
  values (p_user, p_university, p_title, p_price, p_category, p_image_path, p_group) returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.insert_item(uuid, uuid, text, numeric, text, text, uuid) to authenticated;
