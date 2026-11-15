import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, ShieldCheck, Loader2 } from 'lucide-react';
import { useEnable2FAMutation, useConfirm2FAMutation } from '@/store/api/authApi';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TwoFactorSetupModal({ isOpen, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [copied, setCopied] = useState(false);

  const [enable2FA, { data: setupData, isLoading: isEnabling }] = useEnable2FAMutation();
  const [confirm2FA, { isLoading: isConfirming, error }] = useConfirm2FAMutation();

  // Fetch QR on open
  useEffect(() => {
    if (isOpen) {
      enable2FA();
      setStep(1);
      setOtp(['', '', '', '', '', '']);
    }
  }, [isOpen, enable2FA]);

  if (!isOpen) return null;

  const qrUrl = setupData?.qrCodeUrl || setupData?.qr_code_url;

  const handleCopy = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).replace(/\D/g, '');
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i] || '';
      }
      setOtp(newOtp);
      inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
    }
  };

  const handleConfirm = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;

    try {
      await confirm2FA({ code }).unwrap();
      onSuccess();
      onClose();
    } catch {
      // Error handled by RTK query state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-elevated"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-orange" />
            Set up 2-Step Verification
          </h2>
          <button onClick={onClose} className="rounded-md p-1 text-muted hover:bg-sky hover:text-ink">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6 text-center">
                <p className="text-sm text-muted">
                  Scan this QR code with your authenticator app (like Google Authenticator or Authy).
                </p>

                <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-lg bg-sky p-4 shadow-inner">
                  {isEnabling ? (
                    <Loader2 className="h-8 w-8 animate-spin text-orange" />
                  ) : qrUrl ? (
                    <QRCodeSVG value={qrUrl} size={160} level="M" />
                  ) : (
                    <span className="text-sm text-error">Failed to load QR code</span>
                  )}
                </div>

                {setupData?.secret && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase text-muted">Or enter this code manually:</p>
                    <div className="flex items-center justify-center gap-2 font-mono text-sm tracking-wider">
                      <span className="rounded bg-sky px-2 py-1 font-semibold text-ink">{setupData.secret}</span>
                      <button onClick={handleCopy} className="text-muted hover:text-orange" title="Copy code">
                        {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <button onClick={() => setStep(2)} className="btn-primary w-full" disabled={isEnabling || !setupData}>
                  Next
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 text-center">
                <p className="text-sm text-muted">
                  Enter the 6-digit code generated by your authenticator app to verify setup.
                </p>

                <div className="flex justify-center gap-2" onPaste={handlePaste}>
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="h-12 w-12 rounded-lg border border-border bg-white text-center font-display text-xl font-bold text-ink focus:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30"
                    />
                  ))}
                </div>

                {error && <p className="text-sm text-error">Invalid code. Please try again.</p>}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                  <button onClick={handleConfirm} className="btn-primary flex-1" disabled={isConfirming || otp.join('').length !== 6}>
                    {isConfirming ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verify & Save'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
