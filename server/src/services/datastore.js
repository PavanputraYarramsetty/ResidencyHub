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

const floors = [
  { id: '00000000-0000-0000-0000-000000000201', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'Ground Floor', floor_number: 0, is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000202', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'First Floor', floor_number: 1, is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000203', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'Second Floor', floor_number: 2, is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000204', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'Third Floor', floor_number: 3, is_active: true, created_at: new Date().toISOString() },
];

const rooms = [
  // Ground Floor
  { id: '00000000-0000-0000-0000-000000000301', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[0].id, room_number: '101', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000302', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[1].id, room_number: '102', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000303', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[3].id, room_number: '103', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000304', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[4].id, room_number: '104', status: 'available', is_active: true, created_at: new Date().toISOString() },
  // First Floor
  { id: '00000000-0000-0000-0000-000000000305', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[1].id, room_number: '201', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000306', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[1].id, room_number: '202', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000307', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[2].id, room_number: '203', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000308', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[4].id, room_number: '204', status: 'available', is_active: true, created_at: new Date().toISOString() },
  // Second Floor
  { id: '00000000-0000-0000-0000-000000000309', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[2].id, category_id: categories[6].id, room_number: '301', status: 'available', is_active: true, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000310', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[2].id, category_id: categories[1].id, room_number: '302', status: 'available', is_active: true, created_at: new Date().toISOString() },
  // Third Floor
  { id: '00000000-0000-0000-0000-000000000311', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[3].id, category_id: categories[6].id, room_number: '401', status: 'available', is_active: true, created_at: new Date().toISOString() },
];

const customers = [
  {
    id: '00000000-0000-0000-0000-000000000401',
    residency_id: DEFAULT_RESIDENCY_ID,
    full_name: 'Pavanputra Yarramsetty',
    phone: '9491008797',
    age: 28,
    gender: 'Male',
    address: 'Vijayawada, Andhra Pradesh',
    aadhaar_reference: 'XXXX-XXXX-8797',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000402',
    residency_id: DEFAULT_RESIDENCY_ID,
    full_name: 'Ravi Kumar',
    phone: '9848012345',
    age: 35,
    gender: 'Male',
    address: 'Hyderabad, Telangana',
    aadhaar_reference: 'XXXX-XXXX-1234',
    created_at: new Date().toISOString(),
  },
  {
    id: '00000000-0000-0000-0000-000000000403',
    residency_id: DEFAULT_RESIDENCY_ID,
    full_name: 'Suresh Reddy',
    phone: '9988776655',
    age: 42,
    gender: 'Male',
    address: 'Guntur, Andhra Pradesh',
    aadhaar_reference: 'XXXX-XXXX-6655',
    created_at: new Date().toISOString(),
  },
];

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
