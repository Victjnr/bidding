import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';

/* ═══════════════════════════════════════════════════
   RequireKyc Guard
   ─────────────────────────────────────────────────
   Blocks access to routes that require verified KYC.
   Redirects to a KYC prompt page if unverified.
   ═══════════════════════════════════════════════════ */

interface RequireKycProps {
  minTier: 0 | 1 | 2 | 3;
}

export function RequireKyc({ minTier }: RequireKycProps) {
  const user = useAppSelector(selectCurrentUser);

  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  if (user.kycTier < minTier) {
    return <Navigate to="/app/kyc-required" replace />;
  }

  return <Outlet />;
}

export default RequireKyc;
