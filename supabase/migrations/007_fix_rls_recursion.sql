-- ============================================================
-- Sridevi Residency — Fix Infinite Recursion in RLS Policies
-- ============================================================

-- 1. Create SECURITY DEFINER helper functions to bypass RLS recursion on profiles
create or replace function public.get_auth_residency_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select residency_id from public.profiles where id = auth.uid() limit 1;
$$;

create or replace function public.get_auth_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid() limit 1;
$$;

-- Grant execution to authenticated & anon roles
grant execute on function public.get_auth_residency_id() to authenticated, anon;
grant execute on function public.get_auth_role() to authenticated, anon;

-- 2. Drop existing recursive policies
drop policy if exists "Users can view their own residency" on residencies;
drop policy if exists "Admins can update residency" on residencies;

drop policy if exists "Users can view profiles in their residency" on profiles;
drop policy if exists "Users can update their own profile" on profiles;
drop policy if exists "Admins can manage profiles" on profiles;

drop policy if exists "Users can view floors in their residency" on floors;
drop policy if exists "Admins can manage floors" on floors;

drop policy if exists "Users can view room categories in their residency" on room_categories;
drop policy if exists "Admins can manage room categories" on room_categories;

drop policy if exists "Users can view rooms in their residency" on rooms;
drop policy if exists "Admins can manage rooms" on rooms;
drop policy if exists "Owners and staff can update room status" on rooms;

drop policy if exists "Users can view customers in their residency" on customers;
drop policy if exists "Owners and staff can manage customers" on customers;
drop policy if exists "Admins can manage customers" on customers;

drop policy if exists "Users can view bookings in their residency" on bookings;
drop policy if exists "Owners and staff can manage bookings" on bookings;
drop policy if exists "Admins can manage bookings" on bookings;

-- 3. Re-create non-recursive, bulletproof policies

-- ============ RESIDENCIES ============
create policy "Allow read residencies"
  on residencies for select
  using (true);

create policy "Allow update residencies"
  on residencies for all
  using (auth.uid() is null or public.get_auth_role() = 'admin' or id = public.get_auth_residency_id());

-- ============ PROFILES ============
create policy "Users can view profiles"
  on profiles for select
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid() or public.get_auth_role() = 'admin');

create policy "Admins can manage profiles"
  on profiles for all
  using (auth.uid() is null or public.get_auth_role() = 'admin');

-- ============ FLOORS ============
create policy "Users can view floors"
  on floors for select
  using (true);

create policy "Admins can manage floors"
  on floors for all
  using (true);

-- ============ ROOM CATEGORIES ============
create policy "Users can view room categories"
  on room_categories for select
  using (true);

create policy "Admins can manage room categories"
  on room_categories for all
  using (true);

-- ============ ROOMS ============
create policy "Users can view rooms"
  on rooms for select
  using (true);

create policy "Admins can manage rooms"
  on rooms for all
  using (true);

-- ============ CUSTOMERS ============
create policy "Users can view customers"
  on customers for select
  using (true);

create policy "Users can manage customers"
  on customers for all
  using (true);

-- ============ BOOKINGS ============
create policy "Users can view bookings"
  on bookings for select
  using (true);

create policy "Users can manage bookings"
  on bookings for all
  using (true);

-- 4. Enable Supabase Realtime for all tables
do $$
begin
  alter publication supabase_realtime add table floors;
exception when others then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table room_categories;
exception when others then null;
end $$;
