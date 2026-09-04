import api from './api';

export const customerService = {
  async getCustomers(params = {}) {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  async searchCustomers(query) {
    const { data } = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
    return data;
  },

  async getCustomer(customerId) {
    const { data } = await api.get(`/customers/${customerId}`);
    return data;
  },

  async createCustomer(customerData) {
    const { data } = await api.post('/customers', customerData);
    return data;
  },

  async findOrCreateCustomer(customerData) {
    const { data } = await api.post('/customers/find-or-create', customerData);
    return data;
  },

  async updateCustomer(customerId, updates) {
    const { data } = await api.put(`/customers/${customerId}`, updates);
    return data;
  },

  async deleteCustomer(customerId) {
    const { data } = await api.delete(`/customers/${customerId}`);
    return data;
  },
};
