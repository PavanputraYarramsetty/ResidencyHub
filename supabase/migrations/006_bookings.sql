-- 006_bookings.sql: Bookings schema with 24-hour billing units
create type booking_status as enum ('reserved', 'checked_in', 'checked_out', 'cancelled');

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  customer_id uuid not null references customers(id) on delete cascade,
  room_id uuid not null references rooms(id) on delete cascade,
  booking_date date not null default current_date,
  check_in_at timestamptz not null default now(),
  check_out_at timestamptz,
  number_of_persons integer not null default 1,
  price_per_24_hours numeric(10,2) not null default 1500.00,
  billing_units integer not null default 1,
  advance_amount numeric(10,2) not null default 0.00,
  total_amount numeric(10,2) not null default 1500.00,
  status booking_status not null default 'checked_in',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bookings_room_status on bookings(room_id, status);
create index if not exists idx_bookings_customer on bookings(customer_id);
create index if not exists idx_bookings_date on bookings(booking_date);

alter table bookings enable row level security;
create policy "Allow all authenticated users to read bookings" on bookings for select using (true);
create policy "Allow all authenticated users to manage bookings" on bookings for all using (true);
