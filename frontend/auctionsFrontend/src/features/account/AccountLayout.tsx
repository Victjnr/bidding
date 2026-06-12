import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { UserCircle, Shield, CreditCard, Bell, MapPin, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const accountTabs = [
  { label: 'Profile', to: '/app/account', icon: <UserCircle className="h-5 w-5" />, end: true },
  { label: 'Security', to: '/app/account/security', icon: <Shield className="h-5 w-5" /> },
  { label: 'Payment Methods', to: '/app/account/payments', icon: <CreditCard className="h-5 w-5" /> },
  { label: 'Notifications', to: '/app/account/notifications', icon: <Bell className="h-5 w-5" /> },
  { label: 'Addresses', to: '/app/account/addresses', icon: <MapPin className="h-5 w-5" /> },
];

export function AccountLayout() {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-ink">Account Settings</h1>
        <p className="text-muted mt-1">Manage your profile, security, and preferences.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sticky Side Navigation */}
        <aside className="w-full md:w-64 md:sticky md:top-24 shrink-0">
          <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-none">
            {accountTabs.map((tab) => {
              const isActive = tab.end
                ? location.pathname === tab.to
                : location.pathname.startsWith(tab.to);

              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors shrink-0 md:shrink",
                    isActive ? "text-orange" : "text-muted hover:bg-sky/50 hover:text-ink"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="account-tab-active"
                      className="absolute inset-0 rounded-lg bg-orange/10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{tab.icon}</span>
                  <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                </NavLink>
              );
            })}
            
            <div className="hidden md:block my-2 border-t border-border" />
            
            <NavLink
              to="/app/account/close"
              className={({ isActive }) => cn(
                "group relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors shrink-0 md:shrink",
                isActive ? "text-error bg-error/10" : "text-error/70 hover:bg-error/10 hover:text-error"
              )}
            >
              <UserX className="h-5 w-5" />
              <span>Close Account</span>
            </NavLink>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
