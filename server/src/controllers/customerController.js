const customerService = require('../services/customer.service');
const { logger } = require('../utils/logger');

// GET /api/customers — List all customers with search
async function getCustomers(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { search, page = 1, limit = 50 } = req.query;

    const result = await customerService.getCustomers({
      residencyId: residency_id,
      search,
      page,
      limit
    });

    res.json(result);
  } catch (err) {
    logger.error('Failed to fetch customers', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
}

// GET /api/customers/search — Autosuggest search by phone or name
async function searchCustomers(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { q } = req.query;

    const results = await customerService.searchCustomers({
      residencyId: residency_id,
      query: q
    });

    res.json(results);
  } catch (err) {
    logger.error('Failed to search customers', err);
    res.status(500).json({ error: 'Failed to search customers' });
  }
}

// GET /api/customers/:id — Get single customer with booking history
async function getCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const customer = await customerService.getCustomer({ residencyId: residency_id, id });
    res.json(customer);
  } catch (err) {
    logger.error('Failed to fetch customer', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to fetch customer' });
  }
}

// POST /api/customers — Create a new customer
async function createCustomer(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    const data = await customerService.createCustomer({
      residencyId: residency_id,
      full_name,
      phone,
      age,
      address,
      aadhar_number,
      aadhar_photo_url,
      passport_photo_url
    });

    res.status(201).json(data);
  } catch (err) {
    logger.error('Failed to create customer', err);
    if (err.statusCode === 409) {
      return res.status(409).json({ error: 'Customer with this phone number already exists' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to create customer' });
  }
}

// PUT /api/customers/:id — Update a customer
async function updateCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    const data = await customerService.updateCustomer({
      residencyId: residency_id,
      id,
      full_name,
      phone,
      age,
      address,
      aadhar_number,
      aadhar_photo_url,
      passport_photo_url
    });

    res.json(data);
  } catch (err) {
    logger.error('Failed to update customer', err);
    if (err.statusCode === 404) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.status(err.statusCode || 500).json({ error: 'Failed to update customer' });
  }
}

// POST /api/customers/find-or-create — Find by phone or create new
async function findOrCreateCustomer(req, res, next) {
  try {
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';
    const { full_name, phone, age, address, aadhar_number, aadhar_photo_url, passport_photo_url } = req.body;

    const result = await customerService.findOrCreateCustomer({
      residencyId: residency_id,
      full_name,
      phone,
      age,
      address,
      aadhar_number,
      aadhar_photo_url,
      passport_photo_url
    });

    res.status(result.isNew ? 201 : 200).json(result);
  } catch (err) {
    logger.error('Failed to find/create customer', err);
    res.status(err.statusCode || 500).json({ error: 'Failed to process customer' });
  }
}

// DELETE /api/customers/:id — Delete a customer
async function deleteCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const residency_id = req.profile?.residency_id || '00000000-0000-0000-0000-000000000001';

    const result = await customerService.deleteCustomer({ residencyId: residency_id, id });
    res.json(result);
  } catch (err) {
    logger.error('Failed to delete customer', err);
    res.status(err.statusCode || 500).json({ error: 'Failed to delete customer' });
  }
}

module.exports = {
  getCustomers,
  searchCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  findOrCreateCustomer,
  deleteCustomer
};
