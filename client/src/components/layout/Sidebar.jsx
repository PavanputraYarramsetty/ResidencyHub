import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Grid,
  Users,
  Receipt,
  TrendingUp,
  BarChart3,
  Settings,
  Layers,
  ShieldCheck,
  Tags,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { isAdmin } = useAuth();

  const ownerNavItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Rooms Matrix', path: '/owner/rooms', icon: Grid },
    { name: 'Customers', path: '/owner/customers', icon: Users },
    { name: 'Bookings Ledger', path: '/owner/bookings', icon: Receipt },
    { name: 'Revenue Analytics', path: '/owner/revenue', icon: TrendingUp },
    { name: 'Statistics & Reports', path: '/owner/statistics', icon: BarChart3 },
  ];

  const adminNavItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Floors', path: '/admin/floors', icon: Layers },
    { name: 'Rooms', path: '/admin/rooms', icon: Grid },
    { name: 'Categories', path: '/admin/categories', icon: Tags },
    { name: 'Users', path: '/admin/users', icon: ShieldCheck },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Revenue', path: '/admin/revenue', icon: TrendingUp },
    { name: 'Settings', path: '/admin/settings', icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : ownerNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-[260px] bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between overflow-y-auto transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col pt-4">
          {/* Nav Links */}
          <nav className="px-3 py-3 flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-['Inter'] text-xs transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white font-bold shadow-md shadow-blue-600/25 translate-x-0.5'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 font-semibold'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-xs tracking-tight">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
