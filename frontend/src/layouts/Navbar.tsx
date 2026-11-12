import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  '/':           'Dashboard',
  '/plan':       'Plan Your Trip',
  '/results':    'Route Results',
  '/stations':   'CNG Stations',
  '/monitoring': 'Live Queue Monitoring',
  '/compare':    'Station Comparison',
  '/settings':   'Settings',
};

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { pathname } = useLocation();

  // Derive page title: exact match first, then prefix match for /stations/:id
  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/stations/') ? 'Station Details' : 'CNG Navigator');

  return (
    <div className="h-[56px] flex items-center justify-between px-4 gap-3">
      {/* ── Left: Hamburger + Breadcrumb ──────────────── */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Toggle sidebar"
          className="lg:hidden p-2 rounded-md text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          <Menu size={20} />
        </button>
        <span className="text-sm font-semibold text-slate-700 truncate">
          {pageTitle}
        </span>
      </div>

      {/* ── Center: Brand ─────────────────────────────── */}
      <div className="absolute left-1/2 -translate-x-1/2 text-sm font-bold text-slate-800 whitespace-nowrap pointer-events-none">
        🛣️ CNG Navigator
      </div>

      {/* ── Right: Badges + Bell ──────────────────────── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Demo Mode badge */}
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold
                         tracking-widest uppercase bg-amber-100 text-amber-700
                         border border-amber-300 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 sim-dot" />
          Demo Mode
        </span>

        {/* Stations counter badge */}
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold
                         bg-emerald-100 text-emerald-700 border border-emerald-300
                         px-2 py-0.5 rounded-full">
          🏭 14 Stations
        </span>

        {/* Notification bell */}
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <Bell size={18} />
          {/* unread dot */}
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </button>
      </div>
    </div>
  );
};

export default Navbar;
