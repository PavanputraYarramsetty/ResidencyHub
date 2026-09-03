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

  // Responsive sidebar drawer state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface">
        <div className="flex flex-col items-center gap-space-sm">
          <div className="w-10 h-10 border-4 border-surface-container-high border-t-secondary rounded-full animate-spin" />
          <span className="font-label-lg text-label-lg text-on-surface">
            Loading Sridevi Residency...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || isAuthPage) {
    return <AppRoutes />;
  }

  return (
    <ResidencyProvider>
      <div className="min-h-screen bg-surface font-body-md text-on-surface antialiased">
        {/* Fixed Left Sidebar */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Outer Wrapper with Sidebar Padding */}
        <div className="lg:pl-sidebar-width">
          {/* Fixed Top Header */}
          <Navbar
            mobileSidebarOpen={mobileSidebarOpen}
            setMobileSidebarOpen={setMobileSidebarOpen}
          />

          {/* Main View Area */}
          <main className="relative pt-header-height w-full min-h-screen bg-surface">
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
            borderRadius: '8px',
            background: '#131b2e',
            color: '#ffffff',
            fontSize: '13px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          },
          success: {
            iconTheme: { primary: '#069669', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#ba1a1a', secondary: '#FFFFFF' },
          },
        }}
      />
      <AppLayout />
    </AuthProvider>
  );
}
