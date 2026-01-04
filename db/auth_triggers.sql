-- Create a trigger to create a profile when a new auth user is created

create or replace function public.handle_new_user() returns trigger language plpgsql as $$
begin
  insert into profiles (id, email, created_at)
  values (new.id, new.email, now())
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Attach to auth.users as Supabase recommends
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Note: You may also want to capture user.email_verified and other fields.
