import { useAppSelector } from './useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useGetKycStatusQuery } from '@/store/api/authApi';

export function useKycStatus() {
  const user = useAppSelector(selectCurrentUser);
  const { data: kycData, isLoading, refetch } = useGetKycStatusQuery(undefined, {
    skip: !user, // Don't fetch if not logged in
  });

  const tier = user?.kycTier ?? 0;
  const isApproved = user?.status !== 'pending_kyc';
  const pendingDoc = kycData?.status === 'pending';
  const nextTierRequirement = kycData?.nextTierRequirement ?? 'Complete previous tier';

  return {
    tier,
    isApproved,
    pendingDoc,
    nextTierRequirement,
    isLoading,
    refetch,
    // Add raw kycData if needed
    status: kycData?.status ?? 'unverified',
  };
}
