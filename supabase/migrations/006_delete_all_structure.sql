-- ============================================================
-- Sridevi Residency — Complete Wipe of All Data & Structure
-- ============================================================

-- TRUNCATE all bookings, audit logs, customers, rooms, and floors
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE audit_ledger CASCADE;
TRUNCATE TABLE customers CASCADE;
TRUNCATE TABLE rooms CASCADE;
TRUNCATE TABLE floors CASCADE;
TRUNCATE TABLE room_categories CASCADE;

-- Confirmation Notice
SELECT 'Complete database wipe successful. All floors, rooms, customers, bookings, and financial logs deleted.' AS status;
