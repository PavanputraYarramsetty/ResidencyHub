import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Building,
  Tags,
} from 'lucide-react';

export function Sidebar({ isOpen, onClose }) {
  const { isAdmin, profile, loginAsDemo } = useAuth();
  const navigate = useNavigate();

  const ownerNavItems = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Rooms Matrix', path: '/owner/rooms', icon: Grid },
    { name: 'Customers', path: '/owner/customers', icon: Users },
    { name: 'Bookings Ledger', path: '/owner/bookings', icon: Receipt },
    { name: 'Revenue Analytics', path: '/owner/revenue', icon: TrendingUp },
    { name: 'Statistics & Reports', path: '/owner/statistics', icon: BarChart3 },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
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

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'FO';

  function handleSwitchRole(role) {
    loginAsDemo(role);
    navigate(role === 'admin' ? '/admin/dashboard' : '/owner/dashboard');
  }

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
          <nav className="px-3 py-1 flex flex-col gap-1">
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
                    `flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-['Inter'] text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-xs">{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* View Portal Role Switcher */}
        <div className="p-3">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-['Inter']">
              VIEW PORTAL ROLE
            </span>
            <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => handleSwitchRole('owner')}
                className={`py-1.5 px-2 rounded-md text-[11px] font-bold text-center transition-colors cursor-pointer ${
                  !isAdmin
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => handleSwitchRole('admin')}
                className={`py-1.5 px-2 rounded-md text-[11px] font-bold text-center transition-colors cursor-pointer ${
                  isAdmin
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
