const { customers, bookings, rooms, categories, generateUuid } = require('./datastore');
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

    let filtered = customers.filter((c) => !c.residency_id || c.residency_id === residencyId);

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter((c) =>
        (c.full_name && c.full_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
      );
    }

    filtered.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    const total = filtered.length;
    const offset = (pageNum - 1) * limitNum;
    const paginated = filtered.slice(offset, offset + limitNum);

    return {
      customers: paginated,
      total,
      page: pageNum,
      limit: limitNum,
    };
  }

  /**
   * Autosuggest customer search by phone or name with caching
   */
  async searchCustomers({ residencyId, query: q }) {
    const normalized = (q || '').trim().toLowerCase();
    const cacheKey = `residency:${residencyId}:customers:search:${normalized}`;

    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    const matched = customers
      .filter((c) => {
        if (c.residency_id && c.residency_id !== residencyId) return false;
        if (!normalized) return true;
        return (
          (c.phone && c.phone.includes(normalized)) ||
          (c.full_name && c.full_name.toLowerCase().includes(normalized))
        );
      })
      .slice(0, 15)
      .map((c) => ({
        id: c.id,
        full_name: c.full_name,
        phone: c.phone,
        age: c.age,
        gender: c.gender || 'Male',
        address: c.address,
        aadhar_number: c.aadhar_number,
      }));

    await setCache(cacheKey, matched, TTL.CUSTOMER_SEARCH);
    return matched;
  }

  /**
   * Get single customer with booking history
   */
  async getCustomer({ residencyId, id }) {
    const customer = customers.find((c) => c.id === id);
    if (!customer) throw new NotFoundError('Customer not found');

    const customerBookings = bookings
      .filter((b) => b.customer_id === id)
      .map((b) => {
        const rm = rooms.find((r) => r.id === b.room_id) || { room_number: '—' };
        const cat = categories.find((c) => c.id === rm.category_id) || { name: 'Standard' };
        return {
          ...b,
          rooms: {
            room_number: rm.room_number,
            room_categories: cat,
          },
        };
      })
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

    return { ...customer, booking_history: customerBookings };
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

    const existing = customers.find((c) => c.phone === phone);
    if (existing) {
      throw new ConflictError('Customer with this phone number already exists');
    }

    const newCust = {
      id: generateUuid(),
      residency_id: residencyId,
      full_name,
      phone,
      age: age || null,
      address: address || '',
      aadhar_number: aadhar_number || '',
      aadhar_photo_url: aadhar_photo_url || null,
      passport_photo_url: passport_photo_url || null,
      created_at: new Date().toISOString(),
    };

    customers.push(newCust);
    logger.success(`Customer created: ${full_name} (${phone})`);
    await invalidateCustomerSearchCache(residencyId);
    return newCust;
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
    const customer = customers.find((c) => c.id === id);
    if (!customer) throw new NotFoundError('Customer not found');

    if (full_name !== undefined) customer.full_name = full_name;
    if (phone !== undefined) customer.phone = phone;
    if (age !== undefined) customer.age = age;
    if (address !== undefined) customer.address = address;
    if (aadhar_number !== undefined) customer.aadhar_number = aadhar_number;
    if (aadhar_photo_url !== undefined) customer.aadhar_photo_url = aadhar_photo_url;
    if (passport_photo_url !== undefined) customer.passport_photo_url = passport_photo_url;

    await invalidateCustomerSearchCache(residencyId);
    return customer;
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

    let existing = customers.find((c) => c.phone === phone);
    if (existing) {
      if (full_name) existing.full_name = full_name;
      if (age) existing.age = age;
      if (address) existing.address = address;
      if (aadhar_number) existing.aadhar_number = aadhar_number;
      if (aadhar_photo_url) existing.aadhar_photo_url = aadhar_photo_url;
      if (passport_photo_url) existing.passport_photo_url = passport_photo_url;

      await invalidateCustomerSearchCache(residencyId);
      return { customer: existing, isNew: false };
    }

    const newCust = {
      id: generateUuid(),
      residency_id: residencyId,
      full_name,
      phone,
      age: age || null,
      address: address || '',
      aadhar_number: aadhar_number || '',
      aadhar_photo_url: aadhar_photo_url || null,
      passport_photo_url: passport_photo_url || null,
      created_at: new Date().toISOString(),
    };

    customers.push(newCust);
    await invalidateCustomerSearchCache(residencyId);
    logger.success(`New customer created: ${full_name} (${phone})`);
    return { customer: newCust, isNew: true };
  }

  /**
   * Delete customer and disassociate their bookings
   */
  async deleteCustomer({ residencyId, id }) {
    const idx = customers.findIndex((c) => c.id === id);
    if (idx !== -1) {
      customers.splice(idx, 1);
    }

    for (let i = bookings.length - 1; i >= 0; i--) {
      if (bookings[i].customer_id === id) {
        bookings.splice(i, 1);
      }
    }

    await invalidateCustomerSearchCache(residencyId);
    return { message: 'Customer deleted successfully' };
  }
}

module.exports = new CustomerService();
