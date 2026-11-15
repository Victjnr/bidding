import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser, selectAuthLoading } from '@/store/slices/authSlice';
import { FullPageLoader } from '@/components/layout/FullPageLoader';

interface RequireRoleProps {
  allowed: string[];
}

export function RequireRole({ allowed }: RequireRoleProps) {
  const user = useAppSelector(selectCurrentUser);
  const isLoading = useAppSelector(selectAuthLoading);

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (!roles.some((role) => allowed.includes(role))) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}

export default RequireRole;
