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
        <div className="flex flex-col">
          {/* Brand Header */}
          <div className="p-4 pb-2">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center p-1 text-blue-600 shadow-xs">
                <span className="material-symbols-outlined text-xl">apartment</span>
              </div>
              <div>
                <h1 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-slate-900 tracking-tight uppercase leading-tight">
                  SRIDEVI RESIDENCY
                </h1>
                <span className="font-['Inter'] text-[11px] text-slate-500 block">
                  Residency Management System
                </span>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-1 flex items-center gap-1.5">
              <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded uppercase tracking-wider shadow-xs">
                {isAdmin ? 'ADMIN PANEL' : 'OWNER PANEL'}
              </span>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                24/7 ACTIVE
              </span>
            </div>
          </div>

          {/* Profile Card Pill */}
          <div className="px-3.5 py-2">
            <div className="p-2.5 rounded-xl bg-slate-50 flex items-center gap-2.5 border border-slate-200/80 shadow-xs">
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-blue-600 font-['Plus_Jakarta_Sans'] font-bold text-xs">
                {initials}
              </div>
              <div className="overflow-hidden flex-1">
                <span className="font-['Inter'] text-xs font-semibold text-slate-900 truncate block">
                  {profile?.full_name || 'Front Desk Owner'}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">FRONT DESK</span>
                  <span className="text-slate-300 text-[10px]">•</span>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">
                    {isAdmin ? 'ADMIN' : 'OWNER'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="px-3 py-2 flex flex-col gap-1">
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
