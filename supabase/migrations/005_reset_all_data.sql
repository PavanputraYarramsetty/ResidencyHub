-- ============================================================
-- Sridevi Residency — Complete Database Wipe & Reset Script
-- ============================================================

-- TRUNCATE all transactional and booking data
TRUNCATE TABLE bookings CASCADE;
TRUNCATE TABLE audit_ledger CASCADE;
TRUNCATE TABLE customers CASCADE;

-- Reset all room statuses back to 'available'
UPDATE rooms SET status = 'available';

-- Notice message
SELECT 'All customer records, bookings, checkout logs, and revenue history have been completely reset to zero.' AS status;
