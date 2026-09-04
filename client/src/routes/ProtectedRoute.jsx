import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-gray-400 text-xs">
        Loading Sridevi Residency...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

export function RoleRoute({ allowedRoles = [] }) {
  const { profile, loading } = useAuth();

  if (loading) return null;

  const userRole = profile?.role || 'owner';
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to={userRole === 'admin' ? '/admin/dashboard' : '/owner/dashboard'} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
