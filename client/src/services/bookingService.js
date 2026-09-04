import api from '../lib/api';

export const bookingService = {
  getBookings: async (params) => {
    const res = await api.get('/bookings', { params });
    return res.data;
  },
  getBookingById: async (id) => {
    const res = await api.get(`/bookings/${id}`);
    return res.data;
  },
  createBooking: async (bookingData) => {
    const res = await api.post('/bookings', bookingData);
    return res.data;
  },
  checkIn: async (id, payload = {}) => {
    const res = await api.post(`/bookings/${id}/check-in`, payload);
    return res.data;
  },
  checkOut: async (id, payload = {}) => {
    const res = await api.post(`/bookings/${id}/checkout`, payload);
    return res.data;
  },
  cancelBooking: async (id) => {
    const res = await api.post(`/bookings/${id}/cancel`);
    return res.data;
  },
  getTodayStats: async () => {
    const res = await api.get('/bookings/today-stats');
    return res.data;
  },
};

export default bookingService;
