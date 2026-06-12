import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { AppShell } from '@/components/layout/AppShell';
import { RequireAuth } from '@/router/guards/RequireAuth';
import { RequireRole } from '@/router/guards/RequireRole';
import LoginPage from '@/features/auth/LoginPage';
import RegisterPage from '@/features/auth/RegisterPage';
import KycRequiredPage from '@/features/auth/KycRequiredPage';

const AuctionListPage = lazy(() => import('@/features/auctions/AuctionListPage'));
const AuctionDetailPage = lazy(() => import('@/features/auctions/AuctionDetailPage'));
const AuctionWizard = lazy(() => import('@/features/auctions/create/AuctionWizard'));
const WalletPage = lazy(() => import('@/features/payments/WalletPage').then((m) => ({ default: m.WalletPage })));
const PayoutsPage = lazy(() => import('@/features/seller/PayoutsPage').then((m) => ({ default: m.PayoutsPage })));
const NotificationsPage = lazy(() => import('@/features/notifications/NotificationsPage'));
const PreferencesPage = lazy(() => import('@/features/notifications/PreferencesPage'));
const MessagingPage = lazy(() => import('@/features/messaging/MessagingPage'));
const HomePage = lazy(() => import('@/features/home/HomePage').then((m) => ({ default: m.HomePage })));
const SearchPage = lazy(() => import('@/features/search/SearchPage'));
const SavedSearchesPage = lazy(() => import('@/features/search/SavedSearchesPage'));
const AccountLayout = lazy(() => import('@/features/account/AccountLayout').then(m => ({ default: m.AccountLayout })));
const ProfilePage = lazy(() => import('@/features/account/ProfilePage'));
const SecurityPage = lazy(() => import('@/features/account/SecurityPage'));
const PaymentMethodsPage = lazy(() => import('@/features/account/PaymentMethodsPage'));
const MyBidsPage = lazy(() => import('@/features/account/MyBidsPage'));
const WatchlistPage = lazy(() => import('@/features/account/WatchlistPage'));
const AddressesPage = lazy(() => import('@/features/account/AddressesPage'));
const CloseAccountPage = lazy(() => import('@/features/account/CloseAccountPage'));

const SellerDashboardPage = lazy(() => import('@/features/seller/SellerDashboardPage').then((m) => ({ default: m.SellerDashboardPage })));
const ListingsPage = lazy(() => import('@/features/seller/ListingsPage').then((m) => ({ default: m.ListingsPage })));
const AnalyticsPage = lazy(() => import('@/features/seller/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })));

const AdminDashboardPage = lazy(() => import('@/features/admin/DashboardPage'));
const AdminUsersPage = lazy(() => import('@/features/admin/UsersPage'));
const AuctionModerationPage = lazy(() => import('@/features/admin/AuctionModerationPage'));
const KycQueuePage = lazy(() => import('@/features/admin/KycQueuePage'));
const AdminSettingsPage = lazy(() => import('@/features/admin/SettingsPage'));
const AuditLogPage = lazy(() => import('@/features/admin/AuditLogPage'));
import { AdminLayout } from '@/components/layout/AdminLayout';
const SellerProfilePage = lazy(() => import('@/features/seller/SellerProfilePage'));

import LandingPage from '@/features/home/LandingPage';

/* ═══════════════════════════════════════════════════
   Placeholder page components
   ─────────────────────────────────────────────────
   These are temporary stubs. Each feature module will
   provide its own page components.
   ═══════════════════════════════════════════════════ */

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange/10">
        <span className="font-display text-2xl font-bold text-orange">
          {title.charAt(0)}
        </span>
      </div>
      <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
      <p className="text-sm text-muted">This page is under construction.</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Router Configuration
   ═══════════════════════════════════════════════════ */

export const router = createBrowserRouter([
  /* ─── Public Routes ─── */
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'terms',
        element: <PlaceholderPage title="Terms of Service" />,
      },
      {
        path: 'privacy',
        element: <PlaceholderPage title="Privacy Policy" />,
      },
      {
        path: 'support',
        element: <PlaceholderPage title="Support" />,
      },
    ],
  },

  /* ─── Auth Routes ─── */
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: <LoginPage />,
      },
      {
        path: 'register',
        element: <RegisterPage />,
      },
      {
        path: '2fa',
        element: <PlaceholderPage title="Two-Factor Authentication" />,
      },
      {
        path: 'forgot-password',
        element: <PlaceholderPage title="Forgot Password" />,
      },
      {
        path: 'reset-password',
        element: <PlaceholderPage title="Reset Password" />,
      },
    ],
  },

  /* ─── Protected Routes (RequireAuth) ─── */
  {
    path: '/app',
    element: <RequireAuth />,
    children: [
      {
        element: <AppShell />,
        children: [
          /* Default redirect */
          {
            index: true,
            element: <Navigate to="/app/home" replace />,
          },

          /* Home */
          {
            path: 'home',
            element: <HomePage />,
          },

          /* Browse & Search */
          {
            path: 'auctions',
            element: <AuctionListPage />,
          },
          {
            path: 'auctions/:id',
            element: <AuctionDetailPage />,
          },
          {
            path: 'search',
            element: <SearchPage />,
          },
          {
            path: 'saved-searches',
            element: <SavedSearchesPage />,
          },

          /* Bidding */
          {
            path: 'bids',
            element: <MyBidsPage />,
          },

          /* Watchlist */
          {
            path: 'watchlist',
            element: <WatchlistPage />,
          },

          /* Selling */
          {
            path: 'sell',
            element: <AuctionWizard />,
          },

          /* Account */
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { index: true, element: <ProfilePage /> },
              { path: 'security', element: <SecurityPage /> },
              { path: 'payments', element: <PaymentMethodsPage /> },
              { path: 'addresses', element: <AddressesPage /> },
              { path: 'close', element: <CloseAccountPage /> },
              { path: 'notifications', element: <PreferencesPage /> },
            ]
          },

          /* Payments */
          {
            path: 'checkout/:auctionId',
            element: <PlaceholderPage title="Checkout" />,
          },
          {
            path: 'wallet',
            element: <WalletPage />,
          },

          /* Messages */
          {
            path: 'messages',
            element: <MessagingPage />,
          },
          {
            path: 'messages/:conversationId',
            element: <MessagingPage />,
          },

          /* Notifications */
          {
            path: 'notifications',
            element: <NotificationsPage />,
          },

          /* KYC Required */
          {
            path: 'kyc-required',
            element: <KycRequiredPage />,
          },

          /* ─── Seller Routes ─── */
          {
            path: 'seller',
            element: <SellerDashboardPage />,
          },
          {
            path: 'seller/analytics',
            element: <AnalyticsPage />,
          },
          {
            path: 'seller/listings',
            element: <ListingsPage />,
          },
          {
            path: 'seller/payouts',
            element: <PayoutsPage />,
          },
          {
            path: 'seller/profile/:id',
            element: <SellerProfilePage />,
          },

          /* End of AppShell routes */
        ],
      },
      /* ─── Admin Routes (RequireRole & AdminLayout) ─── */
      {
        element: <RequireRole allowed={['admin', 'super_admin']} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                path: 'admin',
                element: <AdminDashboardPage />,
              },
              {
                path: 'admin/users',
                element: <AdminUsersPage />,
              },
              {
                path: 'admin/auctions',
                element: <AuctionModerationPage />,
              },
              {
                path: 'admin/kyc',
                element: <KycQueuePage />,
              },
              {
                path: 'admin/settings',
                element: <AdminSettingsPage />,
              },
              {
                path: 'admin/audit-log',
                element: <AuditLogPage />,
              },
            ],
          },
        ],
      },
    ],
  },
]);

export default router;
