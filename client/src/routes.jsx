import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';

// Owner pages
import Dashboard from './pages/owner/Dashboard';
import RoomsPage from './pages/owner/RoomsPage';
import CustomersPage from './pages/owner/CustomersPage';
import RevenuePage from './pages/owner/RevenuePage';
import StatisticsPage from './pages/owner/StatisticsPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageFloors from './pages/admin/ManageFloors';
import ManageRooms from './pages/admin/ManageRooms';
import EditStructurePage from './pages/admin/EditStructurePage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />

      {/* Owner Routes */}
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
      <Route path="/revenue" element={<ProtectedRoute><RevenuePage /></ProtectedRoute>} />
      <Route path="/statistics" element={<ProtectedRoute><StatisticsPage /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin/edit-structure" element={<ProtectedRoute><EditStructurePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/floors" element={<ProtectedRoute requiredRole="admin"><ManageFloors /></ProtectedRoute>} />
      <Route path="/admin/rooms" element={<ProtectedRoute requiredRole="admin"><ManageRooms /></ProtectedRoute>} />
      <Route path="/admin/categories" element={<ProtectedRoute requiredRole="admin"><ManageRooms /></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
