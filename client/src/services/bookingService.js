import api from './api';

export const bookingService = {
  async getBookings(params = {}) {
    const { data } = await api.get('/bookings', { params });
    return data;
  },

  async getBooking(bookingId) {
    const { data } = await api.get(`/bookings/${bookingId}`);
    return data;
  },

  async createBooking(bookingData) {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  },

  async recordCheckIn(bookingId, checkInTime = null) {
    const { data } = await api.put(`/bookings/${bookingId}/checkin`, {
      check_in: checkInTime || new Date().toISOString(),
    });
    return data;
  },

  async recordCheckOut(bookingId, checkOutTime = null) {
    const { data } = await api.put(`/bookings/${bookingId}/checkout`, {
      check_out: checkOutTime || new Date().toISOString(),
    });
    return data;
  },

  async cancelBooking(bookingId) {
    const { data } = await api.put(`/bookings/${bookingId}/cancel`);
    return data;
  },

  async getTodayStats() {
    const { data } = await api.get('/bookings/stats/today');
    return data;
  },
};
