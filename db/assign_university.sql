-- Function: assign university to a profile based on email domain

create or replace function public.assign_university_by_email(p_user_id uuid) returns void language plpgsql as $$
declare
  user_email text;
  domain text;
  uni_id uuid;
begin
  select email into user_email from profiles where id = p_user_id;
  if user_email is null then return; end if;
  domain := lower(split_part(user_email, '@', 2));
  select id into uni_id from universities where domain = domain limit 1;
  if uni_id is not null then
    update profiles set university_id = uni_id where id = p_user_id;
  end if;
end;
$$;

-- Trigger to call the function after a profile is inserted or updated
create or replace function public.trigger_assign_university() returns trigger language plpgsql as $$
begin
  perform public.assign_university_by_email(new.id);
  return new;
end;
$$;

create trigger profiles_assign_university
  after insert or update on profiles
  for each row execute function public.trigger_assign_university();
