const { supabaseAdmin } = require('../config/supabase');
const { logger } = require('../utils/logger');
const { getCache, setCache, invalidateCustomerSearchCache, TTL } = require('./cache.service');
const { NotFoundError, BadRequestError, ConflictError } = require('../utils/errors');

class CustomerService {
  /**
   * List customers with pagination and optional search filter
   */
  async getCustomers({ residencyId, search, page = 1, limit = 50 }) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = supabaseAdmin
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('residency_id', residencyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      customers: data,
      total: count,
      page: pageNum,
      limit: limitNum
    };
  }

  /**
   * Autosuggest customer search by phone or name with Redis caching
   */
  async searchCustomers({ residencyId, query: q }) {
    if (!q || q.length < 2) {
      return [];
    }

    const normalized = q.trim().toLowerCase();
    const cacheKey = `residency:${residencyId}:customers:search:${normalized}`;

    // 1. Try Redis cache
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .select('id, full_name, phone, age, address, aadhar_number')
      .eq('residency_id', residencyId)
      .or(`phone.ilike.%${q}%,full_name.ilike.%${q}%`)
      .limit(10);

    if (error) throw error;

    // 2. Populate Redis cache
    await setCache(cacheKey, data, TTL.CUSTOMER_SEARCH);

    return data;
  }

  /**
   * Get single customer with booking history
   */
  async getCustomer({ residencyId, id }) {
    const { data: customer, error } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!customer) throw new NotFoundError('Customer not found');

    const { data: bookings } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        rooms (room_number, room_categories (name))
      `)
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    return { ...customer, booking_history: bookings || [] };
  }

  /**
   * Create a new customer
   */
  async createCustomer({
    residencyId,
    full_name,
    phone,
    age,
    address,
    aadhar_number,
    aadhar_photo_url,
    passport_photo_url
  }) {
    if (!full_name || !phone) {
      throw new BadRequestError('full_name and phone are required');
    }

    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert({
        residency_id: residencyId,
        full_name,
        phone,
        age,
        address,
        aadhar_number,
        aadhar_photo_url,
        passport_photo_url
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictError('Customer with this phone number already exists');
      }
      throw error;
    }

    logger.success(`Customer created: ${full_name} (${phone})`);
    await invalidateCustomerSearchCache(residencyId);
    return data;
  }

  /**
   * Update an existing customer
   */
  async updateCustomer({
    residencyId,
    id,
    full_name,
    phone,
    age,
    address,
    aadhar_number,
    aadhar_photo_url,
    passport_photo_url
  }) {
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update({
        full_name,
        phone,
        age,
        address,
        aadhar_number,
        aadhar_photo_url,
        passport_photo_url
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new NotFoundError('Customer not found');

    await invalidateCustomerSearchCache(residencyId);
    return data;
  }

  /**
   * Find existing customer by phone or create new
   */
  async findOrCreateCustomer({
    residencyId,
    full_name,
    phone,
    age,
    address,
    aadhar_number,
    aadhar_photo_url,
    passport_photo_url
  }) {
    if (!full_name || !phone) {
      throw new BadRequestError('full_name and phone are required');
    }

    const { data: existing } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('residency_id', residencyId)
      .eq('phone', phone)
      .single();

    if (existing) {
      const { data: updated, error: updErr } = await supabaseAdmin
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

      if (updErr) throw updErr;

      await invalidateCustomerSearchCache(residencyId);
      return { customer: updated, isNew: false };
    }

    const { data: newCustomer, error } = await supabaseAdmin
      .from('customers')
      .insert({
        residency_id: residencyId,
        full_name,
        phone,
        age,
        address,
        aadhar_number,
        aadhar_photo_url,
        passport_photo_url
      })
      .select()
      .single();

    if (error) throw error;

    await invalidateCustomerSearchCache(residencyId);
    logger.success(`New customer created: ${full_name} (${phone})`);
    return { customer: newCustomer, isNew: true };
  }

  /**
   * Delete customer and cascade/disassociate their bookings
   */
  async deleteCustomer({ residencyId, id }) {
    // Delete bookings associated with customer
    await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('customer_id', id);

    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await invalidateCustomerSearchCache(residencyId);
    return { message: 'Customer deleted successfully' };
  }
}

module.exports = new CustomerService();
