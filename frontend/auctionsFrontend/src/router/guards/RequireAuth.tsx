import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectIsAuthenticated, selectAuthLoading } from '@/store/slices/authSlice';
import { FullPageLoader } from '@/components/layout/FullPageLoader';

export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);
  const location = useLocation();

  if (isLoading) {
    return <FullPageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}

export default RequireAuth;
