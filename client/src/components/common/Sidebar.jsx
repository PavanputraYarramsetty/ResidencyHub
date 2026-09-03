import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ownerSections = [
  {
    title: 'OPERATIONS',
    links: [
      { to: '/rooms', icon: 'grid_view', label: 'Room Management & Grid' },
      { to: '/', icon: 'desk', label: 'Front Desk Dashboard' },
      { to: '/customers', icon: 'badge', label: 'Guest Directory' },
    ]
  },
  {
    title: 'FINANCIALS',
    links: [
      { to: '/revenue', icon: 'receipt_long', label: 'Billing & 24h Tariff' },
      { to: '/statistics', icon: 'history_toggle_off', label: 'Audit & History' },
    ]
  }
];

const adminSections = [
  {
    title: 'ADMINISTRATION',
    links: [
      { to: '/admin', icon: 'dashboard', label: 'System Overview' },
      { to: '/admin/floors', icon: 'apartment', label: 'Manage Floors' },
      { to: '/admin/rooms', icon: 'king_bed', label: 'Manage Rooms & Tariff' },
    ]
  }
];

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isAdminArea = location.pathname.startsWith('/admin');

  const sections = isAdminArea ? adminSections : ownerSections;

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-inverse-surface/40 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-sidebar-width bg-surface-container-low z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Header */}
          <div className="h-header-height flex items-center px-space-lg gap-space-sm bg-surface-container-lowest border-b border-surface-container-high/40">
            {/* SVG Logo */}
            <div className="w-9 h-9 rounded-lg bg-primary-container border border-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-secondary text-[20px]">hotel</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface leading-tight tracking-tight">
                Sridevi Residency
              </span>
              <span className="font-label-md text-label-md text-secondary uppercase tracking-wider">
                Lodge Management
              </span>
            </div>
          </div>

          {/* Nav Sections */}
          <div className="py-space-sm overflow-y-auto max-h-[calc(100vh-140px)]">
            {sections.map((sec) => (
              <div key={sec.title} className="px-space-md py-space-sm">
                <div className="font-label-md text-label-md text-on-surface-variant uppercase px-space-sm mb-space-xs tracking-wider">
                  {sec.title}
                </div>
                <nav className="flex flex-col gap-space-xxs">
                  {sec.links.map(({ to, icon, label }) => (
                    <NavLink
                      key={to}
                      to={to}
                      end={to === '/' || to === '/admin'}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary-container text-on-primary font-label-lg rounded-lg shadow-xs'
                            : 'font-body-md text-body-md text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                        }`
                      }
                    >
                      <span className="material-symbols-outlined text-[18px]">{icon}</span>
                      <span>{label}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            ))}

            {/* Role Switch Shortcut in Sidebar */}
            {isAdmin && (
              <div className="px-space-md py-space-sm">
                <div className="font-label-md text-label-md text-on-surface-variant uppercase px-space-sm mb-space-xs tracking-wider">
                  SWITCH MODULE
                </div>
                <NavLink
                  to={isAdminArea ? '/' : '/admin'}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface font-label-lg hover:bg-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {isAdminArea ? 'store' : 'admin_panel_settings'}
                  </span>
                  <span>{isAdminArea ? 'Owner Operations' : 'Admin Panel'}</span>
                </NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Footer Session Secure Card */}
        <div className="p-space-md m-space-md rounded-xl bg-surface-container-lowest flex items-center justify-between border border-surface-container-high/60 shadow-xs">
          <div className="flex items-center gap-space-sm">
            <span className="material-symbols-outlined text-secondary text-[20px]">lock</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface">Session Secure</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Front Desk Term #01</span>
            </div>
          </div>
          <span className="material-symbols-outlined text-[18px] text-on-tertiary-container" title="Session Verified">
            verified_user
          </span>
        </div>
      </aside>
    </>
  );
}
