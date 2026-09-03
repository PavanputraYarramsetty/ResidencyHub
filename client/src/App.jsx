import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ResidencyProvider } from './context/ResidencyContext';
import Navbar from './components/common/Navbar';
import Sidebar from './components/common/Sidebar';
import AppRoutes from './routes';

function AppLayout() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);

  // Responsive sidebar state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-semibold tracking-wide text-sm">
            Loading Sridevi Residency...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isAuthPage) {
    return <AppRoutes />;
  }

  return (
    <ResidencyProvider>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
        {/* Global Luxury Header */}
        <Navbar
          mobileSidebarOpen={mobileSidebarOpen}
          setMobileSidebarOpen={setMobileSidebarOpen}
        />

        {/* Content Layout */}
        <div className="flex flex-1 w-full max-w-[1680px] mx-auto">
          {/* Sidebar */}
          <Sidebar
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
          />

          {/* Main Page Area */}
          <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 transition-all">
            <AppRoutes />
          </main>
        </div>
      </div>
    </ResidencyProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '14px',
            background: '#0F172A',
            color: '#F8FAFC',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: { primary: '#10B981', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#FFFFFF' },
          },
        }}
      />
      <AppLayout />
    </AuthProvider>
  );
}
