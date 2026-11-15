import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowRight, XCircle } from 'lucide-react';
import type { AuctionClosedEvent } from '@/types/bid';
import type { AuctionResource } from '@/types/auction';
import { useAppSelector } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { PaymentModal } from '@/features/payments/PaymentModal';

interface AuctionClosedModalProps {
  isOpen: boolean;
  eventData: AuctionClosedEvent | null;
  currency: string;
  auction?: AuctionResource;
}

export function AuctionClosedModal({ isOpen, eventData, currency, auction }: AuctionClosedModalProps) {
  const user = useAppSelector(selectCurrentUser);
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (isOpen && eventData && user && eventData.winnerId === user.uuid) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
      }, 250);

      return () => clearInterval(interval);
    }
  }, [isOpen, eventData, user]);

  if (!isOpen || !eventData) return null;

  const isWinner = user && eventData.winnerId === user.uuid;

  if (showPaymentModal && auction) {
    return (
      <PaymentModal
        isOpen={true}
        onClose={() => setShowPaymentModal(false)}
        auction={auction}
        finalPrice={eventData.finalPrice || auction.currentPrice}
      />
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {isWinner ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-orange/10">
                <Trophy className="h-10 w-10 text-orange" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Congratulations!</h2>
              <p className="mt-2 text-muted">
                You won this auction for
              </p>
              <div className="my-6 text-4xl font-display font-bold text-orange">
                {currency} {eventData.finalPrice?.toLocaleString()}
              </div>
              <p className="mb-8 text-sm text-muted">
                The item is yours. Proceed to payment to complete your purchase and arrange delivery.
              </p>
              <button
                onClick={() => (auction ? setShowPaymentModal(true) : navigate('/app/bids'))}
                className="btn-primary w-full text-lg py-4 shadow-orange/30 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                Proceed to Payment
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sky text-muted">
                <XCircle className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-bold text-ink">Auction Ended</h2>
              {eventData.isReserveMet ? (
                <p className="mt-2 text-muted">
                  The winning bid was <span className="font-bold text-ink">{currency} {eventData.finalPrice?.toLocaleString()}</span>.
                </p>
              ) : (
                <p className="mt-2 text-muted">
                  The auction ended because the reserve price was not met.
                </p>
              )}
              <div className="mt-8">
                <button
                  onClick={() => navigate('/app/auctions')}
                  className="btn-outline w-full py-3"
                >
                  Browse Similar Items
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
