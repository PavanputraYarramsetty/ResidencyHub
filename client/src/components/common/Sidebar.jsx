import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BedDouble, Users, IndianRupee, BarChart3,
  Building2, DoorOpen, Tags, UserCog, ChevronLeft, ChevronRight, X
} from 'lucide-react';

const ownerSections = [
  {
    title: 'OPERATIONS',
    links: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview & metrics' },
      { to: '/rooms', icon: BedDouble, label: 'Room Grid', desc: 'Live floor & room map' },
      { to: '/customers', icon: Users, label: 'Customers', desc: 'Directory & history' },
    ]
  },
  {
    title: 'FINANCIALS',
    links: [
      { to: '/revenue', icon: IndianRupee, label: 'Revenue', desc: '24-hr derived billing' },
      { to: '/statistics', icon: BarChart3, label: 'Statistics', desc: 'Audit logs & export' },
    ]
  }
];

const adminSections = [
  {
    title: 'ADMINISTRATION',
    links: [
      { to: '/admin', icon: LayoutDashboard, label: 'Admin Overview', desc: 'System stats' },
      { to: '/admin/floors', icon: Building2, label: 'Manage Floors', desc: 'Add/edit levels' },
      { to: '/admin/rooms', icon: DoorOpen, label: 'Manage Rooms', desc: 'Units & categories' },
      { to: '/admin/categories', icon: Tags, label: 'Tariff & Types', desc: 'Pricing slabs' },
      { to: '/admin/accounts', icon: UserCog, label: 'Staff Logins', desc: 'User privileges' },
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen, collapsed, setCollapsed }) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  const sections = isAdminArea ? adminSections : ownerSections;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <motion.aside
        animate={{ width: collapsed ? 76 : 260 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-30 h-screen lg:h-[calc(100vh-64px)] bg-white border-r border-slate-200/90 shadow-sm flex flex-col justify-between transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header on Mobile Only */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-100">
          <span className="text-sm font-bold text-slate-800">Navigation Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Link Groups */}
        <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
          {sections.map((sec) => (
            <div key={sec.title} className="space-y-1.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {sec.title}
                </p>
              )}

              {sec.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/' || to === '/admin'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md shadow-slate-900/15'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                  title={collapsed ? label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-amber-400' : 'text-slate-400 group-hover:text-slate-700'
                        }`}
                      />
                      {!collapsed && (
                        <span className="truncate">{label}</span>
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="active-pill"
                          className="absolute right-2 w-1.5 h-4 rounded-full bg-amber-400"
                        />
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </div>

        {/* Bottom Collapse Toggle (Desktop only) */}
        <div className="hidden lg:flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
