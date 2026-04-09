alter table public.profiles
  add column if not exists approval_status text not null default 'pending'
    check (approval_status in ('pending', 'approved', 'rejected')),
  add column if not exists approved_at timestamptz null,
  add column if not exists approved_by uuid null references auth.users (id),
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

alter table public.profiles
  alter column role set default 'student';

update public.profiles
set
  role = coalesce(role, 'student'),
  approval_status = coalesce(approval_status, 'pending'),
  updated_at = coalesce(updated_at, timezone('utc', now()))
where role is null
   or approval_status is null
   or updated_at is null;

alter table public.profiles enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
  loop
    execute format(
      'drop policy if exists %I on public.profiles',
      policy_record.policyname
    );
  end loop;
end;
$$;

create policy "Users can read own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "No direct inserts"
on public.profiles
for insert
to authenticated
with check (false);

create policy "No direct updates"
on public.profiles
for update
to authenticated
using (false)
with check (false);

create policy "No direct deletes"
on public.profiles
for delete
to authenticated
using (false);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    role,
    approval_status,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'fullName'),
    'student',
    'pending',
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(public.profiles.full_name, excluded.full_name),
    updated_at = timezone('utc', now());

  return new;
end;
$$;

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('admin', 'superadmin')
      and approval_status = 'approved'
  );
$$;

create or replace function public.current_user_is_superadmin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'superadmin'
      and approval_status = 'approved'
  );
$$;

create or replace function public.admin_list_profiles()
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  approval_status text,
  created_at timestamptz,
  approved_at timestamptz,
  approved_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_user_is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  return query
  select
    profiles.id,
    profiles.email,
    profiles.full_name,
    profiles.role,
    profiles.approval_status,
    profiles.created_at,
    profiles.approved_at,
    profiles.approved_by
  from public.profiles
  order by
    case profiles.approval_status
      when 'pending' then 0
      when 'rejected' then 1
      else 2
    end,
    profiles.created_at desc nulls last;
end;
$$;

create or replace function public.admin_update_profile_access(
  target_user_id uuid,
  next_approval_status text,
  next_role text default null
)
returns table (
  id uuid,
  email text,
  full_name text,
  role text,
  approval_status text,
  created_at timestamptz,
  approved_at timestamptz,
  approved_by uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_role text;
  current_role text;
  current_approval_status text;
  approved_admin_count integer;
begin
  if not public.current_user_is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'CANNOT_MODIFY_SELF';
  end if;

  if next_approval_status not in ('pending', 'approved', 'rejected') then
    raise exception 'INVALID_APPROVAL_STATUS';
  end if;

  resolved_role := coalesce(next_role, 'student');

  if resolved_role not in ('student', 'admin', 'superadmin') then
    raise exception 'INVALID_ROLE';
  end if;

  select
    role,
    approval_status
  into
    current_role,
    current_approval_status
  from public.profiles
  where id = target_user_id;

  if current_role is null then
    raise exception 'TARGET_PROFILE_NOT_FOUND';
  end if;

  select count(*)
  into approved_admin_count
  from public.profiles
  where role in ('admin', 'superadmin')
    and approval_status = 'approved';

  if current_role in ('admin', 'superadmin')
     and not public.current_user_is_superadmin() then
    raise exception 'SUPERADMIN_REQUIRED';
  end if;

  if resolved_role in ('admin', 'superadmin')
     and not public.current_user_is_superadmin() then
    raise exception 'SUPERADMIN_REQUIRED';
  end if;

  if current_role in ('admin', 'superadmin')
     and current_approval_status = 'approved'
     and (
       resolved_role not in ('admin', 'superadmin')
       or next_approval_status <> 'approved'
     )
     and approved_admin_count <= 1 then
    raise exception 'LAST_ADMIN_CONSTRAINT';
  end if;

  return query
  update public.profiles
  set
    role = resolved_role,
    approval_status = next_approval_status,
    approved_at = case
      when next_approval_status = 'approved' then timezone('utc', now())
      else null
    end,
    approved_by = case
      when next_approval_status = 'approved' then auth.uid()
      else null
    end,
    updated_at = timezone('utc', now())
  where profiles.id = target_user_id
  returning
    profiles.id,
    profiles.email,
    profiles.full_name,
    profiles.role,
    profiles.approval_status,
    profiles.created_at,
    profiles.approved_at,
    profiles.approved_by;
end;
$$;

create or replace function public.admin_remove_user(
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_role text;
  current_approval_status text;
  approved_admin_count integer;
begin
  if not public.current_user_is_admin() then
    raise exception 'ADMIN_ONLY';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'CANNOT_MODIFY_SELF';
  end if;

  select
    role,
    approval_status
  into
    current_role,
    current_approval_status
  from public.profiles
  where id = target_user_id;

  if current_role is null then
    raise exception 'TARGET_PROFILE_NOT_FOUND';
  end if;

  select count(*)
  into approved_admin_count
  from public.profiles
  where role in ('admin', 'superadmin')
    and approval_status = 'approved';

  if current_role in ('admin', 'superadmin')
     and not public.current_user_is_superadmin() then
    raise exception 'SUPERADMIN_REQUIRED';
  end if;

  if current_role in ('admin', 'superadmin')
     and current_approval_status = 'approved'
     and approved_admin_count <= 1 then
    raise exception 'LAST_ADMIN_CONSTRAINT';
  end if;

  delete from public.profiles
  where id = target_user_id;

  delete from auth.users
  where id = target_user_id;
end;
$$;

grant execute on function public.current_user_is_admin() to authenticated;
grant execute on function public.current_user_is_superadmin() to authenticated;
grant execute on function public.admin_list_profiles() to authenticated;
grant execute on function public.admin_update_profile_access(uuid, text, text) to authenticated;
grant execute on function public.admin_remove_user(uuid) to authenticated;
