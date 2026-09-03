-- ============================================================
-- Sridevi Residency — Row Level Security Policies
-- ============================================================

-- Enable RLS on all tables
alter table residencies enable row level security;
alter table profiles enable row level security;
alter table floors enable row level security;
alter table room_categories enable row level security;
alter table rooms enable row level security;
alter table customers enable row level security;
alter table bookings enable row level security;

-- ============ RESIDENCIES ============
create policy "Users can view their own residency"
  on residencies for select
  using (
    id in (select residency_id from profiles where id = auth.uid())
  );

create policy "Admins can update residency"
  on residencies for update
  using (
    id in (select residency_id from profiles where id = auth.uid() and role = 'admin')
  );

-- ============ PROFILES ============
create policy "Users can view profiles in their residency"
  on profiles for select
  using (
    residency_id in (select residency_id from profiles where id = auth.uid())
  );

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

create policy "Admins can manage profiles"
  on profiles for all
  using (
    residency_id in (select residency_id from profiles where id = auth.uid() and role = 'admin')
  );

-- ============ FLOORS ============
create policy "Users can view floors in their residency"
  on floors for select
  using (
    residency_id in (select residency_id from profiles where id = auth.uid())
  );

create policy "Admins can manage floors"
  on floors for all
  using (
    residency_id in (select residency_id from profiles where id = auth.uid() and role = 'admin')
  );

-- ============ ROOM CATEGORIES ============
create policy "Users can view room categories in their residency"
  on room_categories for select
  using (
    residency_id in (select residency_id from profiles where id = auth.uid())
  );

create policy "Admins can manage room categories"
  on room_categories for all
  using (
    residency_id in (select residency_id from profiles where id = auth.uid() and role = 'admin')
  );

-- ============ ROOMS ============
create policy "Users can view rooms in their residency"
  on rooms for select
  using (
    floor_id in (
      select f.id from floors f
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid()
    )
  );

create policy "Admins can manage rooms"
  on rooms for all
  using (
    floor_id in (
      select f.id from floors f
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "Owners and staff can update room status"
  on rooms for update
  using (
    floor_id in (
      select f.id from floors f
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid() and p.role in ('owner', 'staff')
    )
  );

-- ============ CUSTOMERS ============
create policy "Users can view customers in their residency"
  on customers for select
  using (
    residency_id in (select residency_id from profiles where id = auth.uid())
  );

create policy "Owners and staff can manage customers"
  on customers for all
  using (
    residency_id in (
      select residency_id from profiles
      where id = auth.uid() and role in ('owner', 'staff')
    )
  );

create policy "Admins can manage customers"
  on customers for all
  using (
    residency_id in (
      select residency_id from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============ BOOKINGS ============
create policy "Users can view bookings in their residency"
  on bookings for select
  using (
    room_id in (
      select r.id from rooms r
      join floors f on f.id = r.floor_id
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid()
    )
  );

create policy "Owners and staff can manage bookings"
  on bookings for all
  using (
    room_id in (
      select r.id from rooms r
      join floors f on f.id = r.floor_id
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid() and p.role in ('owner', 'staff')
    )
  );

create policy "Admins can manage bookings"
  on bookings for all
  using (
    room_id in (
      select r.id from rooms r
      join floors f on f.id = r.floor_id
      join profiles p on p.residency_id = f.residency_id
      where p.id = auth.uid() and p.role = 'admin'
    )
  );
