import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Navigation,
  Route,
  Fuel,
  Activity,
  BarChart2,
  Settings,
  X,
  Zap,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  to: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard',       icon: LayoutDashboard, to: '/' },
  { label: 'Plan Journey',    icon: Navigation,      to: '/plan' },
  { label: 'Route Results',   icon: Route,           to: '/results' },
  { label: 'CNG Stations',    icon: Fuel,            to: '/stations' },
  { label: 'Live Monitoring', icon: Activity,        to: '/monitoring' },
  { label: 'Compare Stations',icon: BarChart2,        to: '/compare' },
  { label: 'Settings',        icon: Settings,        to: '/settings' },
];

interface SidebarProps {
  onClose: () => void;
  isMobile?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, isMobile = false }) => {
  const location = useLocation();

  const isActive = (to: string) =>
    to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);

  return (
    <nav
      className="flex flex-col h-full bg-[#0f172a] text-white select-none"
      style={{ width: 240 }}
    >
      {/* ── Logo / Brand ─────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Zap size={18} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight tracking-wide">
              CNG Navigator
            </div>
            <div className="text-[10px] text-slate-400 leading-tight">
              Smart Station Finder
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        {isMobile && (
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* ── Navigation Items ─────────────────────────── */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map(({ label, icon: Icon, to }) => {
          const active = isActive(to);
          return (
            <NavLink
              key={to}
              to={to}
              onClick={isMobile ? onClose : undefined}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                'transition-all duration-150 cursor-pointer border-l-2',
                active
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 border-transparent',
              ].join(' ')}
              style={{ paddingLeft: 'calc(0.75rem - 2px)' }}
            >
              <Icon
                size={17}
                strokeWidth={active ? 2.5 : 2}
                className={active ? 'text-emerald-400' : 'text-slate-500'}
              />
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>

      {/* ── Bottom: Demo Mode Badge ───────────────────── */}
      <div className="px-3 py-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest
                           bg-amber-500/20 text-amber-400 border border-amber-500/30
                           px-2 py-0.5 rounded-full uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 sim-dot" />
            Demo Mode Active
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Data is simulated. Not for real-world navigation.
        </p>
      </div>
    </nav>
  );
};

export default Sidebar;
