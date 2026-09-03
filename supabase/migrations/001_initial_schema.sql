-- ============================================================
-- Sridevi Residency — Initial Database Schema
-- ============================================================

-- ============ ORGANIZATIONS / USERS ============
create table if not exists residencies (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Sridevi Residency',
  address text,
  created_at timestamptz default now()
);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  residency_id uuid references residencies(id),
  full_name text,
  role text check (role in ('admin','owner','staff')) not null,
  phone text,
  created_at timestamptz default now()
);

-- ============ FLOORS & ROOMS ============
create table if not exists floors (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid references residencies(id),
  floor_number int not null,
  floor_name text,
  created_at timestamptz default now(),
  unique(residency_id, floor_number)
);

create table if not exists room_categories (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid references residencies(id),
  name text not null,
  base_price numeric(10,2) not null,
  max_occupancy int default 2,
  created_at timestamptz default now()
);

create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  floor_id uuid references floors(id) on delete cascade,
  room_number text not null,
  category_id uuid references room_categories(id),
  status text check (status in ('available','occupied','reserved','maintenance')) default 'available',
  created_at timestamptz default now(),
  unique(floor_id, room_number)
);

-- ============ CUSTOMERS ============
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid references residencies(id),
  full_name text not null,
  phone text not null,
  age int,
  address text,
  aadhar_number text,
  aadhar_photo_url text,
  passport_photo_url text,
  created_at timestamptz default now(),
  unique(residency_id, phone)
);

create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_name on customers(full_name);

-- ============ BOOKINGS ============
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references rooms(id),
  customer_id uuid references customers(id),
  no_of_persons int not null default 1,
  booking_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  rate_per_day numeric(10,2) not null,
  billable_days int,
  total_amount numeric(10,2),
  status text check (status in ('booked','checked_in','checked_out','cancelled')) default 'booked',
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create index if not exists idx_bookings_room on bookings(room_id);
create index if not exists idx_bookings_status on bookings(status);
create index if not exists idx_bookings_customer on bookings(customer_id);
create index if not exists idx_bookings_dates on bookings(booking_date);

-- ============ REVENUE VIEW (auto-derived, never manually entered) ============
create or replace view revenue_summary as
select
  date_trunc('day', b.check_out) as revenue_date,
  r.floor_id,
  rc.id as category_id,
  rc.name as category_name,
  f.floor_name,
  f.floor_number,
  count(*) as bookings_completed,
  sum(b.total_amount) as total_revenue
from bookings b
join rooms r on r.id = b.room_id
join room_categories rc on rc.id = r.category_id
join floors f on f.id = r.floor_id
where b.status = 'checked_out'
group by 1, 2, 3, 4, 5, 6;

-- ============ ENABLE REALTIME ============
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table bookings;
