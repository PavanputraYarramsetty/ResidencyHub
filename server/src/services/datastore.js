/**
 * Sridevi Residency — Central In-Memory Datastore
 * Initialized with canonical data matching supabase/seed.sql.
 */
const crypto = require('crypto');

function generateUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substring(2, 15);
}

const DEFAULT_RESIDENCY_ID = '00000000-0000-0000-0000-000000000001';

const profiles = [
  {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'owner@sridevi.com',
    full_name: 'Front Desk Owner',
    role: 'owner',
    phone: '+91 94910 08797',
    residency_id: DEFAULT_RESIDENCY_ID,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'admin@sridevi.com',
    full_name: 'System Admin',
    role: 'admin',
    phone: '+91 98480 22338',
    residency_id: DEFAULT_RESIDENCY_ID,
    created_at: new Date().toISOString(),
  },
];

const categories = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'AC Single',
    description: 'Cozy air-conditioned room for single occupancy',
    max_persons: 1,
    price_per_24_hours: 1500,
    amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'AC Double',
    description: 'Comfortable air-conditioned room for two guests',
    max_persons: 2,
    price_per_24_hours: 2000,
    amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'AC Triple',
    description: 'Spacious air-conditioned room with three beds',
    max_persons: 3,
    price_per_24_hours: 2500,
    amenities: ['AC', 'TV', 'Attached Bathroom', 'WiFi', 'Geyser'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'Non-AC Single',
    description: 'Budget ventilated single room',
    max_persons: 1,
    price_per_24_hours: 800,
    amenities: ['Fan', 'TV', 'Attached Bathroom'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'Non-AC Double',
    description: 'Standard ventilated room for couples/two guests',
    max_persons: 2,
    price_per_24_hours: 1200,
    amenities: ['Fan', 'TV', 'Attached Bathroom'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000106',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'Non-AC Triple',
    description: 'Standard three-bed room',
    max_persons: 3,
    price_per_24_hours: 1600,
    amenities: ['Fan', 'TV', 'Attached Bathroom'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000107',
    residency_id: DEFAULT_RESIDENCY_ID,
    name: 'Deluxe Suite',
    description: 'Premium luxury suite with living area and city view',
    max_persons: 4,
    price_per_24_hours: 3500,
    amenities: ['AC', 'Smart TV', 'Bathtub', 'High-speed WiFi', 'Mini Fridge', 'Room Service'],
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const floors = [];
const rooms = [];
const customers = [];
const bookings = [];
const payments = [];
const auditLogs = [];

module.exports = {
  DEFAULT_RESIDENCY_ID,
  generateUuid,
  profiles,
  categories,
  floors,
  rooms,
  customers,
  bookings,
  payments,
  auditLogs,
};
