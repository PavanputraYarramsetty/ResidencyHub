-- ============================================================
-- Migration 004: Add Advance, Discount, and Days to Bookings & Customers
-- ============================================================

-- Add stay duration and settlement columns to bookings
alter table if exists bookings 
  add column if not exists no_of_days int default 1,
  add column if not exists advance_amount numeric(10,2) default 0.00,
  add column if not exists discount_percent numeric(5,2) default 0.00,
  add column if not exists discount_amount numeric(10,2) default 0.00,
  add column if not exists payment_mode text default 'UPI',
  add column if not exists notes text;

-- Add gender and verification flag to customers
alter table if exists customers 
  add column if not exists gender text check (gender in ('Male','Female','Other')) default 'Male',
  add column if not exists is_verified boolean default true;

-- Update revenue_summary view to reflect net settled amounts
create or replace view revenue_summary as
select
  date_trunc('day', b.check_out) as revenue_date,
  r.floor_id,
  rc.id as category_id,
  rc.name as category_name,
  f.floor_name,
  f.floor_number,
  count(*) as bookings_completed,
  sum(coalesce(b.total_amount, 0)) as total_revenue,
  sum(coalesce(b.advance_amount, 0)) as total_advance_collected,
  sum(coalesce(b.discount_amount, 0)) as total_discounts_granted
from bookings b
join rooms r on r.id = b.room_id
join room_categories rc on rc.id = r.category_id
join floors f on f.id = r.floor_id
where b.status = 'checked_out'
group by 1, 2, 3, 4, 5, 6;
