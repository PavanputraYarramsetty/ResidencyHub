-- 002_floors.sql: Floors schema
create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  floor_name text not null,
  floor_number integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_residency_floor_number unique (residency_id, floor_number)
);

create index if index_floors_residency on floors(residency_id, floor_number);

alter table floors enable row level security;
create policy "Allow all authenticated users to read floors" on floors for select using (true);
create policy "Allow admins to manage floors" on floors for all using (true);
