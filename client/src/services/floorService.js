import api from './api';

export const floorService = {
  async getFloors() {
    const { data } = await api.get('/floors');
    return data;
  },

  async createFloor(floorData) {
    const { data } = await api.post('/floors', floorData);
    return data;
  },

  async updateFloor(floorId, updates) {
    const { data } = await api.put(`/floors/${floorId}`, updates);
    return data;
  },

  async deleteFloor(floorId) {
    const { data } = await api.delete(`/floors/${floorId}`);
    return data;
  },
};
