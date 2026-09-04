-- 004_rooms.sql: Rooms entity
create type room_status as enum ('available', 'occupied', 'maintenance', 'inactive');

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  floor_id uuid not null references floors(id) on delete cascade,
  category_id uuid references room_categories(id) on delete set null,
  room_number text not null,
  status room_status not null default 'available',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_residency_room_number unique (residency_id, room_number)
);

create index if not exists idx_rooms_floor on rooms(floor_id);
create index if not exists idx_rooms_status on rooms(status);

alter table rooms enable row level security;
create policy "Allow read on rooms" on rooms for select using (true);
create policy "Allow update on rooms" on rooms for all using (true);
