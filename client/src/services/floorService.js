import api from '../lib/api';

export const floorService = {
  getFloors: async () => {
    const res = await api.get('/floors');
    return res.data;
  },
  createFloor: async (floorData) => {
    const res = await api.post('/floors', floorData);
    return res.data;
  },
  updateFloor: async (id, floorData) => {
    const res = await api.put(`/floors/${id}`, floorData);
    return res.data;
  },
  deleteFloor: async (id) => {
    const res = await api.delete(`/floors/${id}`);
    return res.data;
  },
};

export default floorService;
