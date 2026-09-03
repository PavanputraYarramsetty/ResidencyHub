import api from './api';

export const roomService = {
  async getRoomsByFloor(floorId) {
    const { data } = await api.get(`/rooms?floor_id=${floorId}`);
    return data;
  },

  async getRoom(roomId) {
    const { data } = await api.get(`/rooms/${roomId}`);
    return data;
  },

  async createRoom(roomData) {
    const { data } = await api.post('/rooms', roomData);
    return data;
  },

  async updateRoom(roomId, updates) {
    const { data } = await api.put(`/rooms/${roomId}`, updates);
    return data;
  },

  async deleteRoom(roomId) {
    const { data } = await api.delete(`/rooms/${roomId}`);
    return data;
  },
};
