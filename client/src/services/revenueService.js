import api from '../lib/api';

export const revenueService = {
  getRevenueSummary: async (params) => {
    const res = await api.get('/revenue', { params });
    return res.data;
  },
  getStatistics: async (params) => {
    const res = await api.get('/statistics/bookings', { params });
    return res.data;
  },
};

export default revenueService;
