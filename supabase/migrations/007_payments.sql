-- 007_payments.sql: Payments transactions
create type payment_method_type as enum ('Cash', 'UPI', 'Card', 'Other');
create type payment_status_type as enum ('pending', 'completed', 'refunded', 'failed');

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_method payment_method_type not null default 'UPI',
  payment_status payment_status_type not null default 'completed',
  transaction_reference text,
  paid_at timestamptz not null default now(),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table payments enable row level security;
create policy "Allow read on payments" on payments for select using (true);
create policy "Allow insert on payments" on payments for insert with check (true);
