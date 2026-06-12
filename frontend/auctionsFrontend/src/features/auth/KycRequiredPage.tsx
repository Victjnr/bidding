import { KycStatusWidget } from '@/features/auth/KycStatusWidget';
import { useAuth } from '@/hooks/useAuth';

export default function KycRequiredPage() {
  const { user } = useAuth();
  
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center p-6">
      <div className="mb-8 text-center max-w-lg">
        <h1 className="font-display text-3xl font-bold text-ink">Verification Required</h1>
        <p className="mt-2 text-muted">
          Hey {user?.firstName}, you need to complete additional identity verification steps before you can access this feature.
        </p>
      </div>
      
      <KycStatusWidget />
    </div>
  );
}
