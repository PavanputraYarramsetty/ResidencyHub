import api from './api';

export const revenueService = {
  // Full revenue summary with breakdown by date, floor, category
  async getRevenueSummary(params = {}) {
    const { data } = await api.get('/revenue', { params });
    return data;
  },

  // Flat list of completed booking records for the ledger table
  async getRevenue(params = {}) {
    const { data } = await api.get('/revenue', { params });
    // Return the flat bookings array for the ledger view
    return data?.bookings || data || [];
  },
};
