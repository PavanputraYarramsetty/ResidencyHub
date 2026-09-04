-- 003_room_categories.sql: Configurable Room Categories
create table if not exists room_categories (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  name text not null,
  description text,
  max_persons integer not null default 2,
  price_per_24_hours numeric(10,2) not null default 1500.00,
  amenities text[] default array['TV', 'Attached Bathroom', 'WiFi'],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_residency_category_name unique (residency_id, name)
);

alter table room_categories enable row level security;
create policy "Allow read on room_categories" on room_categories for select using (true);
create policy "Allow admin write on room_categories" on room_categories for all using (true);
