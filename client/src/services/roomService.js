import api from '../lib/api';

export const roomService = {
  getRooms: async (params) => {
    const res = await api.get('/rooms', { params });
    return res.data;
  },
  getRoomById: async (id) => {
    const res = await api.get(`/rooms/${id}`);
    return res.data;
  },
  createRoom: async (roomData) => {
    const res = await api.post('/rooms', roomData);
    return res.data;
  },
  updateRoom: async (id, roomData) => {
    const res = await api.put(`/rooms/${id}`, roomData);
    return res.data;
  },
  deleteRoom: async (id) => {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  },
  getCategories: async () => {
    const res = await api.get('/rooms/categories');
    return res.data;
  },
  createCategory: async (categoryData) => {
    const res = await api.post('/room-categories', categoryData);
    return res.data;
  },
  updateCategory: async (id, categoryData) => {
    const res = await api.put(`/room-categories/${id}`, categoryData);
    return res.data;
  },
  deleteCategory: async (id) => {
    const res = await api.delete(`/room-categories/${id}`);
    return res.data;
  },
};

export default roomService;
