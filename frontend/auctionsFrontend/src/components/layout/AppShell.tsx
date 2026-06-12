import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  UserCircle,
  LayoutDashboard,
  Shield,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import {
  selectSidebarCollapsed,
  selectMobileSidebarOpen,
  toggleMobileSidebar,
  setMobileSidebarOpen,
} from '@/store/slices/uiSlice';
import { useLogoutMutation } from '@/store/api/authApi';
import { Sidebar } from '@/components/layout/Sidebar';
import { VerifyEmailBanner } from '@/features/auth/VerifyEmailBanner';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { GlobalSearchBar } from '@/components/layout/GlobalSearchBar';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

/* ═══════════════════════════════════════════════════
   AppShell — Main authenticated layout
   ─────────────────────────────────────────────────
   ┌──────────┬──────────────────────────────────────┐
   │          │  Topbar (logo, search, bell, avatar)  │
   │ Sidebar  ├──────────────────────────────────────┤
   │          │  Content (Framer Motion transitions)  │
   │          │                                       │
   └──────────┴──────────────────────────────────────┘
   ═══════════════════════════════════════════════════ */

/** Page transition variants */
const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function AppShell() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector(selectCurrentUser);
  const collapsed = useAppSelector(selectSidebarCollapsed);
  const mobileSidebarOpen = useAppSelector(selectMobileSidebarOpen);
  const [logoutMutation] = useLogoutMutation();

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('super_admin');
  const isSeller = user?.roles?.includes('seller') || isAdmin;
  const isImpersonating = !!(user as any)?.isImpersonating;

  // Close mobile sidebar on route change
  useEffect(() => {
    dispatch(setMobileSidebarOpen(false));
  }, [location.pathname, dispatch]);

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // clearCredentials already dispatched inside the mutation
    }
    navigate('/auth/login', { replace: true });
  };

  const sidebarWidth = collapsed ? 72 : 260;

  return (
    <div className="flex min-h-screen bg-sky flex-col">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-bold text-black">
          <AlertTriangle className="h-4 w-4" />
          You are impersonating <strong>{user?.displayName ?? user?.name}</strong>.
          <button className="ml-4 rounded bg-black/20 px-2 py-0.5 text-xs font-bold text-black hover:bg-black/30 transition-colors">
            Stop Impersonating
          </button>
        </div>
      )}

      <VerifyEmailBanner />

      <div className="flex flex-1">
        {/* ─── Desktop Sidebar ─── */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* ─── Mobile Sidebar Overlay ─── */}
        <AnimatePresence>
          {mobileSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-30 bg-black/50 lg:hidden"
                onClick={() => dispatch(setMobileSidebarOpen(false))}
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 z-40 lg:hidden"
              >
                <Sidebar />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main Area ─── */}
        <div
          className={cn('flex flex-1 flex-col transition-all duration-300')}
          style={{ marginLeft: `${sidebarWidth}px` }}
        >
          {/* ─── Topbar ─── */}
          <header
            className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-white/80 px-4 backdrop-blur-md sm:px-6"
            role="banner"
          >
            {/* Mobile menu button */}
            <button
              onClick={() => dispatch(toggleMobileSidebar())}
              className="rounded-lg p-2 text-muted hover:bg-sky hover:text-ink lg:hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileSidebarOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>

            {/* Center search (desktop) */}
            <div className="hidden flex-1 items-center justify-center px-6 lg:flex">
              <GlobalSearchBar />
            </div>

            {/* Mobile search (full width) */}
            <div className="flex flex-1 lg:hidden">
              <GlobalSearchBar />
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2">
              {/* Notifications bell */}
              <NotificationBell />

              {/* User avatar dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    className="flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-sky outline-none"
                    aria-label={t('nav.myAccount')}
                    id="user-menu-button"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy font-display text-sm font-semibold text-white">
                      {user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
                    </div>
                    <span className="hidden text-sm font-medium text-ink md:block">
                      {user?.displayName ?? 'User'}
                    </span>
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 w-56 animate-in fade-in zoom-in-95 rounded-xl border border-border bg-white p-1.5 shadow-elevated"
                  >
                    <div className="border-b border-border px-3 py-2 mb-1.5">
                      <p className="text-sm font-medium leading-none text-ink">{user?.displayName ?? user?.name}</p>
                      <p className="text-xs text-muted truncate">{user?.email}</p>
                    </div>

                    <DropdownMenu.Item asChild>
                      <Link to="/app/account" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-sky outline-none cursor-pointer">
                        <UserCircle className="h-4 w-4 text-muted" /> My Account
                      </Link>
                    </DropdownMenu.Item>

                    {isSeller && (
                      <DropdownMenu.Item asChild>
                        <Link to="/app/seller" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-sky outline-none cursor-pointer">
                          <LayoutDashboard className="h-4 w-4 text-muted" /> Seller Dashboard
                        </Link>
                      </DropdownMenu.Item>
                    )}

                    {isAdmin && (
                      <DropdownMenu.Item asChild>
                        <Link to="/app/admin" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-ink hover:bg-sky outline-none cursor-pointer">
                          <Shield className="h-4 w-4 text-muted" /> Admin Panel
                        </Link>
                      </DropdownMenu.Item>
                    )}

                    <DropdownMenu.Separator className="my-1.5 h-px bg-border" />

                    <DropdownMenu.Item
                      onSelect={handleLogout}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-error hover:bg-error/10 outline-none cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>
          </header>

          {/* ─── Content Area ─── */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8" role="main">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
