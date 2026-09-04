-- 005_customers.sql: Customers table with document storage paths
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  residency_id uuid not null default '00000000-0000-0000-0000-000000000001',
  full_name text not null,
  phone text not null,
  age integer,
  gender text default 'Male',
  address text,
  aadhaar_reference text,
  aadhaar_document_path text,
  passport_photo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_residency_customer_phone unique (residency_id, phone)
);

create index if not exists idx_customers_phone on customers(phone);
create index if not exists idx_customers_name on customers(full_name);

alter table customers enable row level security;
create policy "Allow authenticated users to read customers" on customers for select using (true);
create policy "Allow authenticated users to insert/update customers" on customers for all using (true);
