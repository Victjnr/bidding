import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

/* ═══════════════════════════════════════════════════
   RequireAuth Guard
   ─────────────────────────────────────────────────
   Redirects unauthenticated users to /auth/login
   while preserving the intended destination.
   ═══════════════════════════════════════════════════ */

export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
