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
