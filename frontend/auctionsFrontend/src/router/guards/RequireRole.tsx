import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import type { AuthUser } from '@/types/auth';

/* ═══════════════════════════════════════════════════
   RequireRole Guard
   ─────────────────────────────────────────────────
   Ensures the authenticated user has one of the
   allowed roles. Renders 403 redirect otherwise.
   ═══════════════════════════════════════════════════ */

interface RequireRoleProps {
  allowed: string[];
}

export function RequireRole({ allowed }: RequireRoleProps) {
  const user = useAppSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (!user.roles.some((role) => allowed.includes(role))) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default RequireRole;
