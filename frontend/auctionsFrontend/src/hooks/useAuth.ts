import { useAppSelector, useAppDispatch } from './useRedux';
import { selectCurrentUser, selectIsAuthenticated, selectAuthLoading, clearCredentials } from '@/store/slices/authSlice';
import { useLoginMutation, useLogoutMutation } from '@/store/api/authApi';
import type { LoginCredentials } from '@/types/auth';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectAuthLoading);

  const [loginMutation, { isLoading: isLoginLoading }] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();

  const login = async (credentials: LoginCredentials) => {
    return loginMutation(credentials).unwrap();
  };

  const logout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore errors on logout network call, already cleared locally by RTK Query logic
    } finally {
      dispatch(clearCredentials());
    }
  };

  const hasRole = (role: string) => {
    return user?.roles?.includes(role) ?? false;
  };

  const hasPermission = (permission: string) => {
    // Implement permission checking logic if needed
    // Usually roles encompass permissions in simpler setups
    return hasRole('super_admin') || hasRole(permission);
  };

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || isLoginLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };
}
