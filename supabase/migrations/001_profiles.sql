-- 001_profiles.sql: User profiles and RBAC
create type user_role as enum ('admin', 'owner', 'receptionist', 'manager', 'accountant');

create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  full_name text not null,
  role user_role not null default 'owner',
  phone text,
  residency_id uuid default '00000000-0000-0000-0000-000000000001',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users can view their own profile or admins view all"
  on profiles for select
  using (auth.uid() = id or (select role from profiles where id = auth.uid()) = 'admin');

create policy "Admins can update user profiles"
  on profiles for update
  using ((select role from profiles where id = auth.uid()) = 'admin');
