-- ============================================================
-- Sridevi Residency — Seed Data
-- ============================================================

-- Insert default residency
insert into residencies (id, name, address)
values (
  '00000000-0000-0000-0000-000000000001',
  'Sridevi Residency',
  'Main Road, City Center'
);

-- Insert room categories
insert into room_categories (id, residency_id, name, base_price, max_occupancy) values
  ('cat-ac-single-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'AC Single', 1500.00, 1),
  ('cat-ac-double-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'AC Double', 2000.00, 2),
  ('cat-nonac-sngl-0001-00000000001', '00000000-0000-0000-0000-000000000001', 'Non-AC Single', 800.00, 1),
  ('cat-nonac-dbl-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'Non-AC Double', 1200.00, 2),
  ('cat-deluxe-0001-000000000001000', '00000000-0000-0000-0000-000000000001', 'Deluxe', 3000.00, 3);

-- Insert floors
insert into floors (id, residency_id, floor_number, floor_name) values
  ('floor-ground-0001-000000000001', '00000000-0000-0000-0000-000000000001', 0, 'Ground Floor'),
  ('floor-first-00001-000000000001', '00000000-0000-0000-0000-000000000001', 1, '1st Floor'),
  ('floor-second-0001-000000000001', '00000000-0000-0000-0000-000000000001', 2, '2nd Floor');

-- Insert rooms — Ground Floor (Rooms 101-105)
insert into rooms (floor_id, room_number, category_id, status) values
  ('floor-ground-0001-000000000001', '101', 'cat-nonac-sngl-0001-00000000001', 'available'),
  ('floor-ground-0001-000000000001', '102', 'cat-nonac-sngl-0001-00000000001', 'available'),
  ('floor-ground-0001-000000000001', '103', 'cat-nonac-dbl-0001-000000000001', 'available'),
  ('floor-ground-0001-000000000001', '104', 'cat-nonac-dbl-0001-000000000001', 'available'),
  ('floor-ground-0001-000000000001', '105', 'cat-ac-single-0001-000000000001', 'available');

-- Insert rooms — 1st Floor (Rooms 201-206)
insert into rooms (floor_id, room_number, category_id, status) values
  ('floor-first-00001-000000000001', '201', 'cat-ac-single-0001-000000000001', 'available'),
  ('floor-first-00001-000000000001', '202', 'cat-ac-single-0001-000000000001', 'available'),
  ('floor-first-00001-000000000001', '203', 'cat-ac-double-0001-000000000001', 'available'),
  ('floor-first-00001-000000000001', '204', 'cat-ac-double-0001-000000000001', 'available'),
  ('floor-first-00001-000000000001', '205', 'cat-ac-double-0001-000000000001', 'available'),
  ('floor-first-00001-000000000001', '206', 'cat-deluxe-0001-000000000001000', 'available');

-- Insert rooms — 2nd Floor (Rooms 301-305)
insert into rooms (floor_id, room_number, category_id, status) values
  ('floor-second-0001-000000000001', '301', 'cat-ac-double-0001-000000000001', 'available'),
  ('floor-second-0001-000000000001', '302', 'cat-ac-double-0001-000000000001', 'available'),
  ('floor-second-0001-000000000001', '303', 'cat-deluxe-0001-000000000001000', 'available'),
  ('floor-second-0001-000000000001', '304', 'cat-deluxe-0001-000000000001000', 'available'),
  ('floor-second-0001-000000000001', '305', 'cat-ac-single-0001-000000000001', 'available');
