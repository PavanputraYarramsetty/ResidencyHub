const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');

// GET /api/customers — List all customers with search
async function getCustomers(req, res) {
  try {
    const { residency_id } = req.profile;
    const { search, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('residency_id', residency_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ customers: data, total: count, page: Number(page), limit: Number(limit) });
  } catch (err) {
    logger.error('Failed to fetch customers', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

// GET /api/customers/search — Autosuggest search by phone or name
async function searchCustomers(req, res) {
  try {
    const { residency_id } = req.profile;
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]);
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, phone, age, address, aadhar_number')
      .eq('residency_id', residency_id)
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Failed to search customers', err);
    res.status(500).json({ error: 'Failed to search customers' });
  }
}

// GET /api/customers/:id — Get single customer with booking history
async function getCustomer(req, res) {
  try {
    const { id } = req.params;

    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Fetch booking history
    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        rooms (room_number, room_categories (name))
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    res.json({ ...customer, booking_history: bookings || [] });
  } catch (err) {
    logger.error('Failed to fetch customer', err);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
}

// POST /api/customers — Create a new customer
async function createCustomer(req, res) {
  try {
    const { residency_id } = req.profile;
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'full_name and phone are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        residency_id, full_name, phone, age, address,
        aadhar_number, aadhar_photo_url, passport_photo_url
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Customer with this phone number already exists' });
      }
      throw error;
    }

    logger.success(`Customer created: ${full_name} (${phone})`);
    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create customer', err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
}

// PUT /api/customers/:id — Update a customer
async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({ full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    logger.error('Failed to update customer', err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

// POST /api/customers/find-or-create — Find by phone or create new
async function findOrCreateCustomer(req, res) {
  try {
    const { residency_id } = req.profile;
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    if (!full_name || !phone) {
      return res.status(400).json({ error: 'full_name and phone are required' });
    }

    // Try to find existing customer by phone
    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('residency_id', residency_id)
      .eq('phone', phone)
      .single();

    if (existing) {
      // Update fields if provided
      const { data: updated } = await supabaseAdmin
        .from('customers')
        .update({
          full_name: full_name || existing.full_name,
          age: age || existing.age,
          address: address || existing.address,
          aadhar_number: aadhar_number || existing.aadhar_number,
          aadhar_photo_url: aadhar_photo_url || existing.aadhar_photo_url,
          passport_photo_url: passport_photo_url || existing.passport_photo_url
        })
        .eq('id', existing.id)
        .select()
        .single();

      return res.json({ customer: updated, isNew: false });
    }

    // Create new customer
    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        residency_id, full_name, phone, age, address,
        aadhar_number, aadhar_photo_url, passport_photo_url
      })
      .select()
      .single();

    if (error) throw error;

    logger.success(`New customer created: ${full_name} (${phone})`);
    res.status(201).json({ customer: newCustomer, isNew: true });
  } catch (err) {
    logger.error('Failed to find/create customer', err);
    res.status(500).json({ error: 'Failed to process customer' });
  }
}

module.exports = { getCustomers, searchCustomers, getCustomer, createCustomer, updateCustomer, findOrCreateCustomer };
