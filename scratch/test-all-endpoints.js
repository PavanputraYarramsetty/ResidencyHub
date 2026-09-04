const http = require('http');

const BASE_URL = 'http://127.0.0.1:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-demo-role': 'admin',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({ status: res.statusCode, data: parsed, raw: data });
        } catch (e) {
          resolve({ status: res.statusCode, data, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runFullBackendAudit() {
  console.log('====================================================');
  console.log('🧪 COMPREHENSIVE BACKEND API ENDPOINT AUDIT SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('✅ PASSED');
      passed++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
      failed++;
    }
  }

  // 1. Health Check
  await test('GET /api/health', async () => {
    const res = await request('GET', '/api/health');
    if (res.status !== 200 || res.data?.status !== 'ok') {
      throw new Error(`Expected status 200, got ${res.status}`);
    }
  });

  // 2. Room Categories
  let testCatId = null;
  await test('GET /api/rooms/categories (and alias /api/categories)', async () => {
    const res1 = await request('GET', '/api/rooms/categories');
    const res2 = await request('GET', '/api/categories');
    if (res1.status !== 200 || !Array.isArray(res1.data)) throw new Error(`Status: ${res1.status}`);
    if (res2.status !== 200 || !Array.isArray(res2.data)) throw new Error(`Alias failed: ${res2.status}`);
  });

  await test('POST /api/rooms/categories (Create Category)', async () => {
    const res = await request('POST', '/api/rooms/categories', {
      name: `Test Suite Deluxe ${Date.now()}`,
      base_price: 2500,
      max_occupancy: 3,
    });
    if (res.status !== 201 || !res.data?.id) throw new Error(`Failed to create category: ${JSON.stringify(res.data)}`);
    testCatId = res.data.id;
  });

  await test('PUT /api/rooms/categories/:id (Update Category)', async () => {
    if (!testCatId) throw new Error('No category to update');
    const res = await request('PUT', `/api/rooms/categories/${testCatId}`, {
      name: `Test Suite Deluxe Updated`,
      base_price: 2700,
    });
    if (res.status !== 200) throw new Error(`Failed to update category: ${res.status}`);
  });

  // 3. Floors
  let testFloorId = null;
  await test('GET /api/floors', async () => {
    const res = await request('GET', '/api/floors');
    if (res.status !== 200 || !Array.isArray(res.data)) throw new Error(`Expected array, got status ${res.status}`);
  });

  await test('POST /api/floors (Create Floor)', async () => {
    const res = await request('POST', '/api/floors', {
      floor_name: 'Audit Floor 99',
      floor_number: 99,
    });
    if (res.status !== 201 || !res.data?.id) throw new Error(`Failed: ${JSON.stringify(res.data)}`);
    testFloorId = res.data.id;
  });

  await test('PUT /api/floors/:id (Update Floor)', async () => {
    if (!testFloorId) throw new Error('No floor created');
    const res = await request('PUT', `/api/floors/${testFloorId}`, {
      floor_name: 'Audit Floor 99 (Renamed)',
    });
    if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
  });

  // 4. Rooms
  let testRoomId = null;
  await test('POST /api/rooms (Create Room in Floor 99)', async () => {
    const res = await request('POST', '/api/rooms', {
      floor_id: testFloorId,
      room_number: '9901',
      category_id: testCatId,
      base_price: 2700,
    });
    if (res.status !== 201 || !res.data?.id) throw new Error(`Failed: ${JSON.stringify(res.data)}`);
    testRoomId = res.data.id;
  });

  await test('GET /api/rooms (List all rooms)', async () => {
    const res = await request('GET', '/api/rooms');
    if (res.status !== 200 || !Array.isArray(res.data)) throw new Error(`Status: ${res.status}`);
    const found = res.data.some(r => r.id === testRoomId);
    if (!found) throw new Error('Created room 9901 not found in list');
  });

  await test('GET /api/rooms/:id (Get single room)', async () => {
    const res = await request('GET', `/api/rooms/${testRoomId}`);
    if (res.status !== 200 || res.data?.room_number !== '9901') throw new Error(`Failed: ${res.status}`);
  });

  await test('PUT /api/rooms/:id (Update Room)', async () => {
    const res = await request('PUT', `/api/rooms/${testRoomId}`, {
      room_number: '9901-A',
      base_price: 2800,
    });
    if (res.status !== 200) throw new Error(`Failed: ${res.status}`);
  });

  // 5. Customers
  let testCustomerId = null;
  const testPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
  await test('POST /api/customers (Create Customer)', async () => {
    const res = await request('POST', '/api/customers', {
      full_name: 'Rajesh Kumar Test',
      phone: testPhone,
      age: 35,
      gender: 'Male',
      address: 'Hyderabad, Telangana',
      aadhar_number: '1234 5678 9012',
    });
    if (res.status !== 201 || !res.data?.id) throw new Error(`Failed: ${JSON.stringify(res.data)}`);
    testCustomerId = res.data.id;
  });

  await test('GET /api/customers (List Customers)', async () => {
    const res = await request('GET', '/api/customers');
    const list = res.data?.customers || res.data?.data || (Array.isArray(res.data) ? res.data : null);
    if (res.status !== 200 || !Array.isArray(list)) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/customers/search (Search Customer by Phone / Name)', async () => {
    const res = await request('GET', `/api/customers/search?q=${testPhone}`);
    if (res.status !== 200 || !Array.isArray(res.data)) throw new Error(`Status: ${res.status}`);
    if (res.data.length === 0) throw new Error('Customer search returned no results');
  });

  await test('PUT /api/customers/:id (Update Customer)', async () => {
    const res = await request('PUT', `/api/customers/${testCustomerId}`, {
      full_name: 'Rajesh Kumar Test Updated',
    });
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  // 6. Bookings Flow (Create Booking -> Checkin -> Checkout)
  let testBookingId = null;
  await test('POST /api/bookings (Create & Check-In Booking)', async () => {
    const res = await request('POST', '/api/bookings', {
      room_id: testRoomId,
      full_name: 'Rajesh Kumar Test Updated',
      phone: testPhone,
      aadhar_number: '1234 5678 9012',
      age: 35,
      gender: 'Male',
      address: 'Hyderabad, Telangana',
      no_of_persons: 2,
      no_of_days: 1,
      advance_amount: 500,
      rate_per_day: 2800,
      total_amount: 2800,
      payment_mode: 'UPI',
      booking_date: new Date().toISOString().split('T')[0],
      check_in: new Date().toISOString(),
    });
    if (res.status !== 201 || !res.data?.id) throw new Error(`Failed: ${JSON.stringify(res.data)}`);
    testBookingId = res.data.id;
  });

  await test('GET /api/bookings (List Bookings)', async () => {
    const res = await request('GET', '/api/bookings');
    const list = Array.isArray(res.data) ? res.data : res.data?.bookings;
    if (res.status !== 200 || !Array.isArray(list)) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/bookings/:id (Get Single Booking)', async () => {
    const res = await request('GET', `/api/bookings/${testBookingId}`);
    if (res.status !== 200 || res.data?.id !== testBookingId) throw new Error(`Status: ${res.status}`);
  });

  await test('POST /api/bookings/:id/checkout (Check-Out and Settle Bill)', async () => {
    const res = await request('POST', `/api/bookings/${testBookingId}/checkout`, {
      net_total: 2800,
      discount_percent: 0,
      discount_amount: 0,
      payment_mode: 'UPI',
    });
    if (res.status !== 200 || res.data?.status !== 'checked_out') throw new Error(`Status: ${res.status}, data: ${JSON.stringify(res.data)}`);
  });

  // 7. Revenue & Dashboard Reports
  await test('GET /api/revenue (Get Revenue Bookings)', async () => {
    const res = await request('GET', '/api/revenue');
    if (res.status !== 200 || (typeof res.data?.total_revenue === 'undefined' && !Array.isArray(res.data))) {
      throw new Error(`Status: ${res.status}`);
    }
  });

  await test('GET /api/revenue/summary (Get Aggregated Revenue Summary)', async () => {
    const res = await request('GET', '/api/revenue/summary');
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  await test('GET /api/revenue/dashboard (Get Live Dashboard Statistics)', async () => {
    const res = await request('GET', '/api/revenue/dashboard');
    if (res.status !== 200 || typeof res.data?.total_rooms === 'undefined') {
      throw new Error(`Dashboard stats failed: ${JSON.stringify(res.data)}`);
    }
  });

  // 8. Cleanup & Delete Test Fixtures
  await test('DELETE /api/rooms/:id (Delete Test Room)', async () => {
    const res = await request('DELETE', `/api/rooms/${testRoomId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  await test('DELETE /api/floors/:id (Delete Test Floor)', async () => {
    const res = await request('DELETE', `/api/floors/${testFloorId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  await test('DELETE /api/rooms/categories/:id (Delete Test Category)', async () => {
    const res = await request('DELETE', `/api/rooms/categories/${testCatId}`);
    if (res.status !== 200) throw new Error(`Status: ${res.status}`);
  });

  console.log('\n====================================================');
  console.log(`📊 FINAL BACKEND TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runFullBackendAudit().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
