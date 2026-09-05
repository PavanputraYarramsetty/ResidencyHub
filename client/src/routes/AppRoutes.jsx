import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import { ProtectedRoute, RoleRoute } from './ProtectedRoute';

// Auth
import Login from '../pages/auth/Login';

// Owner Pages
import OwnerDashboard from '../pages/owner/Dashboard';
import OwnerRooms from '../pages/owner/Rooms';
import OwnerCustomers from '../pages/owner/Customers';
import OwnerBookings from '../pages/owner/Bookings';
import OwnerRevenue from '../pages/owner/Revenue';
import OwnerStatistics from '../pages/owner/Statistics';

// Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import AdminFloors from '../pages/admin/Floors';
import AdminRooms from '../pages/admin/Rooms';
import AdminCategories from '../pages/admin/Categories';
import AdminUsers from '../pages/admin/Users';
import AdminCustomers from '../pages/admin/Customers';
import AdminRevenue from '../pages/admin/Revenue';
import AdminSettings from '../pages/admin/Settings';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Route */}
      <Route path="/login" element={<Login />} />

      {/* Protected Routes inside AppLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Owner Portal */}
          <Route path="/owner" element={<RoleRoute allowedRoles={['owner', 'admin', 'manager', 'receptionist']} />}>
            <Route index element={<Navigate to="/owner/dashboard" replace />} />
            <Route path="dashboard" element={<OwnerDashboard />} />
            <Route path="rooms" element={<OwnerRooms />} />
            <Route path="customers" element={<OwnerCustomers />} />
            <Route path="bookings" element={<OwnerBookings />} />
            <Route path="revenue" element={<OwnerRevenue />} />
            <Route path="statistics" element={<OwnerStatistics />} />
          </Route>

          {/* Admin Portal */}
          <Route path="/admin" element={<RoleRoute allowedRoles={['admin']} />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="floors" element={<AdminFloors />} />
            <Route path="rooms" element={<AdminRooms />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>

      {/* Default Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
    </Routes>
  );
}

export default AppRoutes;
