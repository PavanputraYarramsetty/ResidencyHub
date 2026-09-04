-- seed.sql: Initial seed data for Sridevi Residency
-- Profiles
insert into profiles (id, email, full_name, role, phone, residency_id)
values 
  ('00000000-0000-0000-0000-000000000002', 'owner@sridevi.com', 'Front Desk Owner', 'owner', '+91 94910 08797', '00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000003', 'admin@sridevi.com', 'System Admin', 'admin', '+91 98480 22338', '00000000-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- Room Categories
insert into room_categories (id, name, description, max_persons, price_per_24_hours, amenities)
values
  ('00000000-0000-0000-0000-000000000101', 'AC Single', 'Cozy air-conditioned room for single occupancy', 1, 1500.00, array['AC', 'TV', 'Attached Bathroom', 'WiFi']),
  ('00000000-0000-0000-0000-000000000102', 'AC Double', 'Comfortable air-conditioned room for two guests', 2, 2000.00, array['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser']),
  ('00000000-0000-0000-0000-000000000103', 'AC Triple', 'Spacious air-conditioned room with three beds', 3, 2500.00, array['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser']),
  ('00000000-0000-0000-0000-000000000104', 'Non-AC Single', 'Budget ventilated single room', 1, 800.00, array['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000105', 'Non-AC Double', 'Standard ventilated room for couples/two guests', 2, 1200.00, array['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000106', 'Non-AC Triple', 'Standard three-bed room', 3, 1600.00, array['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000107', 'Deluxe Suite', 'Premium luxury suite with living area and city view', 4, 3500.00, array['AC', 'Smart TV', 'Bathtub', 'High-speed WiFi', 'Mini Fridge', 'Room Service'])
on conflict (id) do nothing;

-- Floors
insert into floors (id, floor_name, floor_number)
values
  ('00000000-0000-0000-0000-000000000201', 'Ground Floor', 0),
  ('00000000-0000-0000-0000-000000000202', 'First Floor', 1),
  ('00000000-0000-0000-0000-000000000203', 'Second Floor', 2),
  ('00000000-0000-0000-0000-000000000204', 'Third Floor', 3)
on conflict (id) do nothing;

-- Rooms
insert into rooms (id, floor_id, category_id, room_number, status)
values
  -- Ground Floor
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '101', 'available'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000102', '102', 'available'),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000104', '103', 'available'),
  ('00000000-0000-0000-0000-000000000304', '00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000105', '104', 'available'),
  -- First Floor
  ('00000000-0000-0000-0000-000000000305', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', '201', 'available'),
  ('00000000-0000-0000-0000-000000000306', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', '202', 'available'),
  ('00000000-0000-0000-0000-000000000307', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000103', '203', 'available'),
  ('00000000-0000-0000-0000-000000000308', '00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000105', '204', 'available'),
  -- Second Floor
  ('00000000-0000-0000-0000-000000000309', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000107', '301', 'available'),
  ('00000000-0000-0000-0000-000000000310', '00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000102', '302', 'available'),
  -- Third Floor
  ('00000000-0000-0000-0000-000000000311', '00000000-0000-0000-0000-000000000204', '00000000-0000-0000-0000-000000000107', '401', 'available')
on conflict (id) do nothing;

-- Customers
insert into customers (id, full_name, phone, age, gender, address, aadhaar_reference)
values
  ('00000000-0000-0000-0000-000000000401', 'Pavanputra Yarramsetty', '9491008797', 28, 'Male', 'Vijayawada, Andhra Pradesh', 'XXXX-XXXX-8797'),
  ('00000000-0000-0000-0000-000000000402', 'Ravi Kumar', '9848012345', 35, 'Male', 'Hyderabad, Telangana', 'XXXX-XXXX-1234'),
  ('00000000-0000-0000-0000-000000000403', 'Suresh Reddy', '9988776655', 42, 'Male', 'Guntur, Andhra Pradesh', 'XXXX-XXXX-6655')
on conflict (id) do nothing;
