import api from './api';

export const revenueService = {
  async getRevenueSummary(params = {}) {
    const { data } = await api.get('/revenue', { params });
    return data;
  },
};
