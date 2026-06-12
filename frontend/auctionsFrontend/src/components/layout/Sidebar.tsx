import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gavel,
  HandCoins,
  Eye,
  Store,
  UserCircle,
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  ListChecks,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  selectSidebarCollapsed,
  toggleSidebar,
} from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';

/* ═══════════════════════════════════════════════════
   Sidebar Navigation
   ═══════════════════════════════════════════════════ */

interface NavItem {
  labelKey: string;
  to: string;
  icon: React.ReactNode;
}

const mainNavItems: NavItem[] = [
  { labelKey: 'nav.browse', to: '/app/auctions', icon: <Gavel className="h-5 w-5" /> },
  { labelKey: 'nav.myBids', to: '/app/bids', icon: <HandCoins className="h-5 w-5" /> },
  { labelKey: 'nav.watchlist', to: '/app/watchlist', icon: <Eye className="h-5 w-5" /> },
  { labelKey: 'nav.sell', to: '/app/sell', icon: <Store className="h-5 w-5" /> },
  { labelKey: 'nav.myAccount', to: '/app/account', icon: <UserCircle className="h-5 w-5" /> },
];

const sellerNavItems: NavItem[] = [
  { labelKey: 'nav.sellerDashboard', to: '/app/seller', icon: <LayoutDashboard className="h-5 w-5" /> },
  { labelKey: 'nav.sellerAnalytics', to: '/app/seller/analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { labelKey: 'nav.sellerListings', to: '/app/seller/listings', icon: <ListChecks className="h-5 w-5" /> },
];

const adminNavItems: NavItem[] = [
  { labelKey: 'nav.adminDashboard', to: '/app/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { labelKey: 'nav.adminUsers', to: '/app/admin/users', icon: <Users className="h-5 w-5" /> },
  { labelKey: 'nav.adminAuctions', to: '/app/admin/auctions', icon: <Gavel className="h-5 w-5" /> },
  { labelKey: 'nav.adminSettings', to: '/app/admin/settings', icon: <Settings className="h-5 w-5" /> },
];

export function Sidebar() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
  const isSeller = user?.roles?.includes('seller') || isAdmin;

  const renderNavGroup = (items: NavItem[], groupLabel?: string) => (
    <div className="space-y-1">
      {groupLabel && !collapsed && (
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
          {groupLabel}
        </p>
      )}
      {items.map((item) => {
        const isActive =
          location.pathname === item.to ||
          location.pathname.startsWith(item.to + '/');

        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={cn(
              'group relative flex items-center gap-3 rounded-r-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              collapsed && 'justify-center px-2',
              isActive
                ? 'bg-white/[0.08] text-orange border-l-[4px] border-orange'
                : 'text-white/70 hover:bg-white/[0.05] hover:text-white border-l-[4px] border-transparent',
            )}
            aria-label={t(item.labelKey)}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Active indicator — handled via border-l now */}
            {isActive && (
              <motion.div
                layoutId="sidebar-active"
                className="absolute inset-0 rounded-r-lg bg-white/[0.08]"
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}

            <span className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>

            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {t(item.labelKey)}
                </motion.span>
              )}
            </AnimatePresence>

            {/* Tooltip on collapsed */}
            {collapsed && (
              <div className="pointer-events-none absolute left-full z-50 ml-2 hidden rounded-md bg-navy-dark px-2.5 py-1.5 text-xs text-white shadow-elevated group-hover:block">
                {t(item.labelKey)}
              </div>
            )}
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-white/10 bg-navy',
        'overflow-hidden',
      )}
      aria-label="Main navigation"
    >
      {/* ─── Logo ─── */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange font-display text-lg font-bold text-white">
          U
        </div>
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="font-display text-xl font-bold text-white"
            >
              Upload Auctions
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Navigation ─── */}
      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {renderNavGroup(mainNavItems)}

        {isSeller && (
          <>
            <div className="mx-3 border-t border-white/10" />
            {renderNavGroup(sellerNavItems, t('nav.sell'))}
          </>
        )}

        {isAdmin && (
          <>
            <div className="mx-3 border-t border-white/10" />
            {renderNavGroup(adminNavItems, t('nav.admin'))}
          </>
        )}
      </nav>

      {/* ─── Collapse toggle ─── */}
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => dispatch(toggleSidebar())}
          className={cn(
            'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/50',
            'transition-colors duration-200 hover:bg-white/8 hover:text-white',
            collapsed && 'justify-center px-2',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

export default Sidebar;
