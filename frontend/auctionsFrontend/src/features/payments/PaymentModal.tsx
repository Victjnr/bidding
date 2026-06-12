import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { useInitiatePaymentMutation } from '@/store/api/paymentApi';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import type { AuctionResource } from '@/types/auction';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  auction: AuctionResource;
  finalPrice: number;
}

export function PaymentModal({ isOpen, onClose, auction, finalPrice }: PaymentModalProps) {
  const currentUser = useAppSelector(selectCurrentUser);
  const [initiatePayment, { isLoading }] = useInitiatePaymentMutation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [paymentMethod, setPaymentMethod] = useState<'ecocash' | 'onemoney' | 'paynow_web'>('ecocash');
  const [mobileNumber, setMobileNumber] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fixed 5% buyer premium for example
  const buyerPremium = finalPrice * 0.05;
  const totalToPay = finalPrice + buyerPremium;

  if (!isOpen) return null;

  const handleInitiate = async () => {
    setErrorMsg('');
    
    if ((paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && !mobileNumber) {
      setErrorMsg('Mobile number is required for mobile money payments.');
      return;
    }

    try {
      const res = await initiatePayment({
        auctionUuid: auction.uuid,
        paymentMethod,
        mobileNumber: paymentMethod !== 'paynow_web' ? mobileNumber : undefined,
        email: currentUser?.email || 'guest@example.com',
      }).unwrap();

      if (res.success) {
        if (paymentMethod === 'paynow_web' && res.redirectUrl) {
          window.location.href = res.redirectUrl;
        } else {
          setSuccessMsg(res.instructions || 'Please check your phone for the USSD prompt to complete payment.');
          setStep(3);
        }
      } else {
        setErrorMsg('Failed to initiate payment.');
      }
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'A network error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="bg-navy p-6 text-white text-center">
          <h2 className="font-display text-xl font-bold">Secure Checkout</h2>
          <p className="text-sky/80 text-sm mt-1">Powered by Paynow</p>
        </div>

        <div className="p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4 border-b border-border pb-4">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-sky shrink-0">
                    {auction.media[0] && (
                      <img src={auction.media[0].cdnUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-ink line-clamp-1">{auction.title}</h3>
                    <p className="text-sm text-muted">Won on {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Winning Bid</span>
                    <span className="font-medium text-ink">{auction.currency} {finalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted">Buyer Premium (5%)</span>
                    <span className="font-medium text-ink">{auction.currency} {buyerPremium.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  <hr className="border-border" />
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-navy">Total to Pay</span>
                    <span className="text-orange">{auction.currency} {totalToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="btn-primary w-full py-4 text-lg"
                >
                  Choose Payment Method
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-3">
                  <label className="text-sm font-medium text-ink">Select Method</label>
                  
                  <div
                    onClick={() => setPaymentMethod('ecocash')}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                      paymentMethod === 'ecocash' ? 'border-orange bg-orange/5 ring-1 ring-orange' : 'border-border hover:border-orange/50'
                    }`}
                  >
                    <Smartphone className={`h-6 w-6 ${paymentMethod === 'ecocash' ? 'text-orange' : 'text-muted'}`} />
                    <div className="flex-1">
                      <p className="font-bold text-ink">EcoCash</p>
                      <p className="text-xs text-muted">Express mobile checkout</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${paymentMethod === 'ecocash' ? 'border-orange bg-orange' : 'border-muted'}`} />
                  </div>

                  <div
                    onClick={() => setPaymentMethod('onemoney')}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                      paymentMethod === 'onemoney' ? 'border-orange bg-orange/5 ring-1 ring-orange' : 'border-border hover:border-orange/50'
                    }`}
                  >
                    <Smartphone className={`h-6 w-6 ${paymentMethod === 'onemoney' ? 'text-orange' : 'text-muted'}`} />
                    <div className="flex-1">
                      <p className="font-bold text-ink">OneMoney</p>
                      <p className="text-xs text-muted">Express mobile checkout</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${paymentMethod === 'onemoney' ? 'border-orange bg-orange' : 'border-muted'}`} />
                  </div>

                  <div
                    onClick={() => setPaymentMethod('paynow_web')}
                    className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition-all ${
                      paymentMethod === 'paynow_web' ? 'border-orange bg-orange/5 ring-1 ring-orange' : 'border-border hover:border-orange/50'
                    }`}
                  >
                    <CreditCard className={`h-6 w-6 ${paymentMethod === 'paynow_web' ? 'text-orange' : 'text-muted'}`} />
                    <div className="flex-1">
                      <p className="font-bold text-ink">Card / Zimswitch</p>
                      <p className="text-xs text-muted">Redirect to secure portal</p>
                    </div>
                    <div className={`h-4 w-4 rounded-full border-2 ${paymentMethod === 'paynow_web' ? 'border-orange bg-orange' : 'border-muted'}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {(paymentMethod === 'ecocash' || paymentMethod === 'onemoney') && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-1.5 overflow-hidden"
                    >
                      <label className="text-sm font-medium text-ink">Mobile Number</label>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="077..."
                        className="input"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {errorMsg && (
                  <div className="flex items-center gap-2 rounded-md bg-error/10 p-3 text-sm text-error">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-outline flex-1">Back</button>
                  <button onClick={handleInitiate} disabled={isLoading} className="btn-primary flex-[2] py-3 text-lg">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : `Pay ${auction.currency} ${totalToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6 py-6"
              >
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-10 w-10 text-success" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-ink">Payment Initiated</h3>
                  <p className="mt-2 text-muted">{successMsg}</p>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-muted bg-sky p-4 rounded-xl">
                  <ShieldCheck className="h-5 w-5 text-navy" />
                  Your payment is securely processing.
                </div>

                <button onClick={onClose} className="btn-outline w-full mt-4">
                  Close & Return to Dashboard
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
