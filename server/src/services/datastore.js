/**
 * Local In-Memory Datastore
 * Provides self-contained data storage for floors, rooms, categories, customers, bookings, and profiles.
 * Replaces external remote database connections.
 */

const crypto = require('crypto');

function generateUuid() {
  return crypto.randomUUID ? crypto.randomUUID() : 'id-' + Math.random().toString(36).substring(2, 15);
}

const DEFAULT_RESIDENCY_ID = '00000000-0000-0000-0000-000000000001';

const categories = [
  { id: '00000000-0000-0000-0000-000000000101', residency_id: DEFAULT_RESIDENCY_ID, name: 'AC Single', base_price: 1500, max_occupancy: 1, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000102', residency_id: DEFAULT_RESIDENCY_ID, name: 'AC Double', base_price: 2000, max_occupancy: 2, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000103', residency_id: DEFAULT_RESIDENCY_ID, name: 'Non-AC Single', base_price: 800, max_occupancy: 1, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000104', residency_id: DEFAULT_RESIDENCY_ID, name: 'Non-AC Double', base_price: 1200, max_occupancy: 2, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000105', residency_id: DEFAULT_RESIDENCY_ID, name: 'Deluxe Suite', base_price: 3000, max_occupancy: 3, created_at: new Date().toISOString() },
];

const floors = [
  { id: '00000000-0000-0000-0000-000000000201', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'Ground Floor', floor_number: 0, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000202', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'First Floor', floor_number: 1, created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000203', residency_id: DEFAULT_RESIDENCY_ID, floor_name: 'Second Floor', floor_number: 2, created_at: new Date().toISOString() },
];

const rooms = [
  // Ground Floor
  { id: '00000000-0000-0000-0000-000000000301', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[0].id, room_number: '101', status: 'available', created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000302', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[1].id, room_number: '102', status: 'available', created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000303', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[0].id, category_id: categories[2].id, room_number: '103', status: 'available', created_at: new Date().toISOString() },
  // First Floor
  { id: '00000000-0000-0000-0000-000000000304', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[1].id, room_number: '201', status: 'available', created_at: new Date().toISOString() },
  { id: '00000000-0000-0000-0000-000000000305', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[1].id, category_id: categories[3].id, room_number: '202', status: 'available', created_at: new Date().toISOString() },
  // Second Floor
  { id: '00000000-0000-0000-0000-000000000306', residency_id: DEFAULT_RESIDENCY_ID, floor_id: floors[2].id, category_id: categories[4].id, room_number: '301', status: 'available', created_at: new Date().toISOString() },
];

const customers = [
  {
    id: '00000000-0000-0000-0000-000000000401',
    full_name: 'Rajesh Kumar',
    phone: '9848012345',
    age: 35,
    gender: 'Male',
    aadhar_number: '123456789012',
    address: 'Hyderabad, Telangana',
    created_at: new Date().toISOString(),
  },
];

const bookings = [];
const ledgers = [];

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

module.exports = {
  DEFAULT_RESIDENCY_ID,
  generateUuid,
  categories,
  floors,
  rooms,
  customers,
  bookings,
  ledgers,
  profiles,
};
