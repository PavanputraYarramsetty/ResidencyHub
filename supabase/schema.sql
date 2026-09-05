-- ==============================================================================
-- 🏨 SRIDEVI RESIDENCY — COMPLETE SUPABASE DATABASE SCHEMA & SEED SCRIPT
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------------------------
-- 1. ENUMS & CUSTOM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'admin', 'manager', 'receptionist', 'accountant');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE room_status AS ENUM ('available', 'occupied', 'maintenance', 'inactive');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM ('checked_in', 'checked_out', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_mode AS ENUM ('cash', 'upi', 'card', 'net_banking', 'split');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_type AS ENUM ('advance', 'final', 'extra_hours', 'refund');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLES DEFINITION
-- ------------------------------------------------------------------------------

-- (A) Profiles (Staff & Roles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'receptionist',
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (B) Floors
CREATE TABLE IF NOT EXISTS public.floors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_name TEXT NOT NULL,
  floor_number INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (C) Room Categories
CREATE TABLE IF NOT EXISTS public.room_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_persons INTEGER NOT NULL DEFAULT 2,
  price_per_24_hours NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  amenities TEXT[] DEFAULT ARRAY['TV', 'Attached Bathroom'],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (D) Rooms
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.room_categories(id) ON DELETE RESTRICT,
  room_number TEXT NOT NULL UNIQUE,
  status room_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (E) Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  age INTEGER,
  gender TEXT DEFAULT 'Male',
  aadhar_number TEXT,
  address TEXT,
  id_proof_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (F) Bookings (24-Hour Cycle Rule Engine)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE RESTRICT,
  check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_out TIMESTAMPTZ,
  rate_per_24_hours NUMERIC(10, 2) NOT NULL DEFAULT 1500.00,
  billing_units INTEGER NOT NULL DEFAULT 1, -- Number of 24h slots
  extra_hours NUMERIC(5, 2) DEFAULT 0.00,
  extra_hour_charges NUMERIC(10, 2) DEFAULT 0.00,
  advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  payment_mode payment_mode NOT NULL DEFAULT 'cash',
  status booking_status NOT NULL DEFAULT 'checked_in',
  id_proof_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (G) Payments Ledger
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_type payment_type NOT NULL DEFAULT 'advance',
  payment_mode payment_mode NOT NULL DEFAULT 'cash',
  transaction_id TEXT,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (H) Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR HIGH-SPEED QUERIES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON public.rooms(floor_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_room ON public.bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- ------------------------------------------------------------------------------
-- 4. TRIGGERS: AUTO-UPDATE ROOM STATUS ON BOOKINGS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_room_status_on_booking()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') AND (NEW.status = 'checked_in') THEN
    UPDATE public.rooms SET status = 'occupied', updated_at = NOW() WHERE id = NEW.room_id;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF NEW.status = 'checked_out' OR NEW.status = 'cancelled' THEN
      UPDATE public.rooms SET status = 'available', updated_at = NOW() WHERE id = NEW.room_id;
    ELSIF NEW.status = 'checked_in' THEN
      UPDATE public.rooms SET status = 'occupied', updated_at = NOW() WHERE id = NEW.room_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_booking_room_status ON public.bookings;
CREATE TRIGGER trg_booking_room_status
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION update_room_status_on_booking();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users & service roles full operational access
CREATE POLICY "Allow public read-write for application service" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for floors" ON public.floors FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for room_categories" ON public.room_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for rooms" ON public.rooms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for bookings" ON public.bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. INITIAL SEED DATA
-- ------------------------------------------------------------------------------

-- Staff Profiles
INSERT INTO public.profiles (id, email, full_name, role, phone)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'owner@sridevi.com', 'Front Desk Owner', 'owner', '+91 94910 08797'),
  ('00000000-0000-0000-0000-000000000002', 'admin@sridevi.com', 'System Admin', 'admin', '+91 98480 22338'),
  ('00000000-0000-0000-0000-000000000003', 'manager@sridevi.com', 'Lodge Manager', 'manager', '+91 98765 43210'),
  ('00000000-0000-0000-0000-000000000004', 'reception@sridevi.com', 'Day Receptionist', 'receptionist', '+91 91234 56789')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name;

-- Room Categories & 24h Tariffs
INSERT INTO public.room_categories (id, name, description, max_persons, price_per_24_hours, amenities)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'AC Single', 'Cozy air-conditioned room for single occupancy', 1, 1500.00, ARRAY['AC', 'TV', 'Attached Bathroom', 'WiFi']),
  ('00000000-0000-0000-0000-000000000102', 'AC Double', 'Comfortable air-conditioned room for two guests', 2, 2000.00, ARRAY['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser']),
  ('00000000-0000-0000-0000-000000000103', 'AC Triple', 'Spacious air-conditioned room with three beds', 3, 2500.00, ARRAY['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser']),
  ('00000000-0000-0000-0000-000000000104', 'Non-AC Single', 'Budget ventilated single room', 1, 800.00, ARRAY['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000105', 'Non-AC Double', 'Standard ventilated room for couples/two guests', 2, 1200.00, ARRAY['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000106', 'Non-AC Triple', 'Standard three-bed room for families', 3, 1600.00, ARRAY['Fan', 'TV', 'Attached Bathroom']),
  ('00000000-0000-0000-0000-000000000107', 'Deluxe Suite', 'Premium luxury suite with living area and city view', 4, 3500.00, ARRAY['AC', 'Smart TV', 'Bathtub', 'High-speed WiFi', 'Mini Fridge', 'Room Service'])
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. ENABLE REALTIME REPLICATION (For instant cross-device live sync)
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.floors;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;

