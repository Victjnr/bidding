import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Gavel,
  ShieldCheck,
  Settings,
  FileText,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { selectSidebarCollapsed, toggleSidebar } from '@/store/slices/uiSlice';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { selectCurrentUser } from '@/store/slices/authSlice';

const adminNavItems = [
  { label: 'Dashboard', to: '/app/admin', icon: <LayoutDashboard className="h-5 w-5" />, end: true },
  { label: 'Users', to: '/app/admin/users', icon: <Users className="h-5 w-5" /> },
  { label: 'Auctions', to: '/app/admin/auctions', icon: <Gavel className="h-5 w-5" /> },
  { label: 'KYC Queue', to: '/app/admin/kyc', icon: <ShieldCheck className="h-5 w-5" /> },
  { label: 'Settings', to: '/app/admin/settings', icon: <Settings className="h-5 w-5" /> },
  { label: 'Audit Log', to: '/app/admin/audit-log', icon: <FileText className="h-5 w-5" /> },
];

export function AdminLayout() {
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const user = useAppSelector(selectCurrentUser);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-[#070F1A]">
      {/* Admin Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex h-screen flex-col border-r border-white/5 bg-[#070F1A] overflow-hidden"
      >
        {/* Header */}
        <div className="flex h-16 items-center gap-3 border-b border-white/5 px-4">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange font-display text-lg font-bold text-white">
            U
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="flex flex-col overflow-hidden"
              >
                <span className="font-display text-lg font-bold text-white">Upload Auctions</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange">Admin</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Back to App Link */}
        <div className="px-3 py-3 border-b border-white/5">
          <NavLink
            to="/app/home"
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-white/40 hover:bg-white/5 hover:text-white/70 transition-colors',
              collapsed && 'justify-center px-2',
            )}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </NavLink>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {adminNavItems.map((item) => {
            const isActive = item.end
              ? location.pathname === item.to
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  collapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-orange text-white shadow-md shadow-orange/25'
                    : 'text-white/50 hover:bg-white/5 hover:text-white/80',
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="admin-sidebar-active"
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-white"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="flex-shrink-0">{item.icon}</span>
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {collapsed && (
                  <div className="pointer-events-none absolute left-full z-50 ml-2 hidden rounded-md bg-[#0D2137] px-2.5 py-1.5 text-xs text-white shadow-elevated group-hover:block">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t border-white/5 p-3">
          <button
            onClick={() => dispatch(toggleSidebar())}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/30 hover:bg-white/5 hover:text-white/60 transition-colors',
              collapsed && 'justify-center px-2',
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <><ChevronLeft className="h-4 w-4" /><span>Collapse</span></>}
          </button>
        </div>
      </motion.aside>

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Admin Topbar */}
        <header className="flex h-14 sm:h-16 shrink-0 items-center justify-between border-b border-white/5 bg-[#0A1628] px-3 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-xs sm:text-sm font-medium text-white/60 whitespace-nowrap">Admin Panel</h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <NotificationBell />
            <div className="flex items-center gap-2 text-white/70 min-w-0">
              <div className="flex h-7 sm:h-8 w-7 sm:w-8 items-center justify-center rounded-full bg-orange/20 text-xs font-bold text-orange flex-shrink-0">
                {user?.displayName?.charAt(0).toUpperCase() ?? 'A'}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden lg:block truncate">{user?.displayName}</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-[#0D1A2D] p-3 sm:p-6 lg:p-8">
          <Suspense fallback={<div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-orange border-t-transparent" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
