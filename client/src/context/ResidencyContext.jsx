import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const ResidencyContext = createContext(null);

const MOCK_CATEGORIES = [
  { id: 'cat-1', name: 'AC Single', base_price: 1500, max_occupancy: 1 },
  { id: 'cat-2', name: 'AC Double', base_price: 2000, max_occupancy: 2 },
  { id: 'cat-3', name: 'Non-AC Single', base_price: 800, max_occupancy: 1 },
  { id: 'cat-4', name: 'Non-AC Double', base_price: 1200, max_occupancy: 2 },
  { id: 'cat-5', name: 'Deluxe Suite', base_price: 3000, max_occupancy: 3 },
];

const MOCK_FLOORS = [
  {
    id: 'floor-ground',
    floor_number: 0,
    floor_name: 'Ground Floor',
    stats: { totalRooms: 5, occupiedRooms: 2, availableRooms: 3, reservedRooms: 0 },
    rooms: [
      { id: 'r101', room_number: '101', status: 'available', category_id: 'cat-3', room_categories: MOCK_CATEGORIES[2] },
      { id: 'r102', room_number: '102', status: 'occupied', category_id: 'cat-3', room_categories: MOCK_CATEGORIES[2] },
      { id: 'r103', room_number: '103', status: 'available', category_id: 'cat-4', room_categories: MOCK_CATEGORIES[3] },
      { id: 'r104', room_number: '104', status: 'occupied', category_id: 'cat-4', room_categories: MOCK_CATEGORIES[3] },
      { id: 'r105', room_number: '105', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
    ]
  },
  {
    id: 'floor-1st',
    floor_number: 1,
    floor_name: '1st Floor',
    stats: { totalRooms: 6, occupiedRooms: 3, availableRooms: 2, reservedRooms: 1 },
    rooms: [
      { id: 'r201', room_number: '201', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
      { id: 'r202', room_number: '202', status: 'occupied', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
      { id: 'r203', room_number: '203', status: 'occupied', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r204', room_number: '204', status: 'reserved', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r205', room_number: '205', status: 'occupied', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r206', room_number: '206', status: 'available', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
    ]
  },
  {
    id: 'floor-2nd',
    floor_number: 2,
    floor_name: '2nd Floor',
    stats: { totalRooms: 5, occupiedRooms: 1, availableRooms: 4, reservedRooms: 0 },
    rooms: [
      { id: 'r301', room_number: '301', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r302', room_number: '302', status: 'available', category_id: 'cat-2', room_categories: MOCK_CATEGORIES[1] },
      { id: 'r303', room_number: '303', status: 'occupied', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
      { id: 'r304', room_number: '304', status: 'available', category_id: 'cat-5', room_categories: MOCK_CATEGORIES[4] },
      { id: 'r305', room_number: '305', status: 'available', category_id: 'cat-1', room_categories: MOCK_CATEGORIES[0] },
    ]
  }
];

export function ResidencyProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [floors, setFloors] = useState(MOCK_FLOORS);
  const [categories, setCategories] = useState(MOCK_CATEGORIES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFloors();
      fetchCategories();
    }
  }, [isAuthenticated]);

  async function fetchFloors() {
    try {
      setLoading(true);
      const { data } = await api.get('/floors');
      if (Array.isArray(data) && data.length > 0) {
        setFloors(data);
      }
    } catch (err) {
      console.warn('API connection offline — using demo floor data');
    } finally {
      setLoading(false);
    }
  }

  async function fetchCategories() {
    try {
      const { data } = await api.get('/rooms/categories');
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      }
    } catch (err) {
      console.warn('API connection offline — using demo category data');
    }
  }

  const value = {
    floors,
    categories,
    loading,
    refreshFloors: fetchFloors,
    refreshCategories: fetchCategories,
  };

  return <ResidencyContext.Provider value={value}>{children}</ResidencyContext.Provider>;
}

export function useResidency() {
  const context = useContext(ResidencyContext);
  if (!context) throw new Error('useResidency must be used within ResidencyProvider');
  return context;
}

export default ResidencyContext;
