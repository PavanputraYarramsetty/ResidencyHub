import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, Users, IndianRupee, BarChart3,
  Building2, DoorOpen, Tags, UserCog, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const ownerLinks = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/rooms', icon: BedDouble, label: 'Rooms' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/revenue', icon: IndianRupee, label: 'Revenue' },
  { to: '/statistics', icon: BarChart3, label: 'Statistics' },
];

const adminLinks = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/floors', icon: Building2, label: 'Manage Floors' },
  { to: '/admin/rooms', icon: DoorOpen, label: 'Manage Rooms' },
  { to: '/admin/categories', icon: Tags, label: 'Categories' },
  { to: '/admin/accounts', icon: UserCog, label: 'Accounts' },
];

export default function Sidebar() {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');
  const [collapsed, setCollapsed] = useState(false);

  const links = isAdminArea ? adminLinks : ownerLinks;

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="hidden lg:flex flex-col h-[calc(100vh-64px)] sticky top-16 bg-white border-r border-surface-200 shadow-sm z-40"
    >
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/' || to === '/admin'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                  : 'text-surface-600 hover:bg-surface-100 hover:text-brand-700'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center p-3 border-t border-surface-200 text-surface-400 hover:text-brand-600 hover:bg-surface-50 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </button>
    </motion.aside>
  );
}
