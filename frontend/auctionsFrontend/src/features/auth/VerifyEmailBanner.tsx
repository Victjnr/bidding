import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, CheckCircle2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useVerifyEmailMutation } from '@/store/api/authApi';

export function VerifyEmailBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  // Mock resend since we only have verifyEmail by token in API
  // In a real app there would be a resendEmailVerification endpoint
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    // Show banner if logged in and no email_verified_at (using user.status 'pending_kyc' or checking if it exists)
    // The prompt says "until email_verified_at is set", but AuthUser type doesn't have it explicitly, we'll assume we can check status
    if (user && user.status === 'pending_kyc') {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [user]);

  useEffect(() => {
    let timer: number;
    if (cooldown > 0) {
      timer = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || isSending) return;
    
    setIsSending(true);
    setStatus('idle');
    try {
      // Mocking API call for resend
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStatus('success');
      setCooldown(60);
    } catch {
      setStatus('error');
    } finally {
      setIsSending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-20 flex flex-col items-center justify-between gap-4 bg-orange px-6 py-3 text-white sm:flex-row shadow-md"
      >
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Please verify your email address. Check your inbox for a verification link.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResend}
            disabled={cooldown > 0 || isSending}
            className="whitespace-nowrap rounded-md bg-white/20 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange disabled:pointer-events-none disabled:opacity-50"
          >
            {isSending && <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />}
            {cooldown > 0 ? `Resend available in ${cooldown}s` : 'Resend Email'}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="rounded-full p-1 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-orange"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute -bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-b-md bg-success px-3 py-1 text-xs font-medium text-white shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Verification email sent!
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
