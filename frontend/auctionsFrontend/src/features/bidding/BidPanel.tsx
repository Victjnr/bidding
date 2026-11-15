import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gavel, CheckCircle2, XCircle, Loader2, Info } from 'lucide-react';
import type { AuctionResource } from '@/types/auction';
import { useBidRoom } from '@/hooks/useBidRoom';
import { useCountdown } from '@/hooks/useCountdown';
import { useProxyBid } from '@/hooks/useProxyBid';
import { usePlaceBidMutation } from '@/store/api/auctionApi';
import { useAppSelector } from '@/hooks/useRedux';
import { selectIsAuthenticated, selectCurrentUser } from '@/store/slices/authSlice';
import { AuctionClosedModal } from './AuctionClosedModal';

export function BidPanel({ auction }: { auction: AuctionResource }) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const currentUser = useAppSelector(selectCurrentUser);
  const isSeller = currentUser?.uuid === auction.seller.uuid;

  // Real-time hooks
  const room = useBidRoom(auction.uuid);
  const { days, hours, minutes, seconds, isExpired, urgency } = useCountdown(room.endAt);
  const proxy = useProxyBid(auction.uuid);

  // Mutations
  const [placeBid, { isLoading: isPlacingBid }] = usePlaceBidMutation();

  // Local state
  const [bidAmount, setBidAmount] = useState('');
  const [proxyAmount, setProxyAmount] = useState('');
  const [isProxyEnabled, setIsProxyEnabled] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Flash animation trigger for price changes
  const [priceFlashKey, setPriceFlashKey] = useState(0);
  useEffect(() => {
    setPriceFlashKey((prev) => prev + 1);
  }, [room.currentPrice]);

  const handlePlaceBid = async () => {
    setErrorMsg('');
    const amount = Number(bidAmount);

    if (isNaN(amount) || amount < room.nextMinBid) {
      setErrorMsg(`Bid must be at least ${auction.currency} ${room.nextMinBid.toLocaleString()}`);
      return;
    }

    try {
      if (isProxyEnabled && proxyAmount) {
        const pAmount = Number(proxyAmount);
        if (isNaN(pAmount) || pAmount <= amount) {
          setErrorMsg(`Maximum proxy bid must be greater than your current bid of ${amount}`);
          return;
        }
        // Fire both proxy setup and the immediate bid
        await proxy.setProxy(pAmount);
        await placeBid({ auctionUuid: auction.uuid, amount }).unwrap();
      } else {
        await placeBid({ auctionUuid: auction.uuid, amount }).unwrap();
      }
      setBidAmount('');
      setProxyAmount('');
      setIsProxyEnabled(false);
    } catch (err: any) {
      setErrorMsg(err?.data?.message || 'Failed to place bid. Please try again.');
    }
  };

  const isDisabled = !isAuthenticated || room.isEnded || isExpired || isSeller || isPlacingBid || proxy.isPlacing;

  return (
    <>
      <AuctionClosedModal
        isOpen={room.isEnded}
        eventData={room.winnerData}
        currency={auction.currency}
        auction={auction}
      />

      <div className="rounded-xl border border-border bg-white shadow-elevated overflow-hidden">
        {/* Header / Countdown */}
        <div className="bg-navy p-4 text-white text-center">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-sky/80 mb-2">
            {room.isEnded ? 'Auction Ended' : 'Time Remaining'}
          </h3>
          <div className="flex justify-center gap-4 font-display text-3xl font-bold">
            {room.isEnded ? (
              <span className="text-muted text-xl">Closed</span>
            ) : (
              <>
                <div className="flex flex-col items-center">
                  <span className={urgency === 'critical' ? 'text-error' : ''}>{String(days).padStart(2, '0')}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-sky/60 mt-1">Days</span>
                </div>
                <span className="text-sky/40">:</span>
                <div className="flex flex-col items-center">
                  <span className={urgency === 'critical' ? 'text-error' : ''}>{String(hours).padStart(2, '0')}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-sky/60 mt-1">Hrs</span>
                </div>
                <span className="text-sky/40">:</span>
                <div className="flex flex-col items-center">
                  <span className={urgency === 'critical' ? 'text-error animate-pulse' : ''}>{String(minutes).padStart(2, '0')}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-sky/60 mt-1">Min</span>
                </div>
                <span className="text-sky/40">:</span>
                <div className="flex flex-col items-center">
                  <span className={urgency === 'critical' ? 'text-error animate-pulse' : ''}>{String(seconds).padStart(2, '0')}</span>
                  <span className="text-[10px] font-medium uppercase tracking-widest text-sky/60 mt-1">Sec</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Price Area */}
          <div className="text-center">
            <p className="text-sm font-medium text-muted uppercase tracking-wider mb-1">Current Price</p>
            <motion.div
              key={priceFlashKey}
              initial={{ scale: 1.1, color: '#E8540A' }}
              animate={{ scale: 1, color: '#111827' }}
              transition={{ duration: 0.5 }}
              className="font-display text-4xl font-bold"
            >
              {auction.currency} {room.currentPrice.toLocaleString()}
            </motion.div>

            <div className="mt-2 flex items-center justify-center gap-1.5">
              {room.isReserveMet ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Reserve Met
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-muted">
                  <XCircle className="h-3.5 w-3.5" /> Reserve Not Met
                </span>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* Bid Inputs */}
          <div className="space-y-4">
            {errorMsg && (
              <div className="rounded border border-error/50 bg-error/10 p-3 text-sm text-error">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="bidAmount" className="text-sm font-medium text-ink">
                Your Bid
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                  {auction.currency}
                </span>
                <input
                  id="bidAmount"
                  type="number"
                  min={room.nextMinBid}
                  step="0.01"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  disabled={isDisabled}
                  placeholder={room.nextMinBid.toString()}
                  className="input pl-12 text-lg font-bold"
                />
              </div>
              <p className="text-xs text-muted flex items-center gap-1">
                <Info className="h-3 w-3" />
                Minimum bid: {auction.currency} {room.nextMinBid.toLocaleString()}
              </p>
            </div>

            {/* Proxy Toggle */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsProxyEnabled(!isProxyEnabled)}
                disabled={isDisabled}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none disabled:opacity-50 ${isProxyEnabled ? 'bg-orange' : 'bg-border'
                  }`}
              >
                <span
                  className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${isProxyEnabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                />
              </button>
              <span className="text-sm font-medium text-ink">Enable Auto-Bid (Proxy)</span>
            </div>

            <AnimatePresence>
              {isProxyEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5 overflow-hidden"
                >
                  <label htmlFor="proxyAmount" className="text-sm font-medium text-ink">
                    Maximum Auto-Bid Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-muted">
                      {auction.currency}
                    </span>
                    <input
                      id="proxyAmount"
                      type="number"
                      step="0.01"
                      value={proxyAmount}
                      onChange={(e) => setProxyAmount(e.target.value)}
                      disabled={isDisabled}
                      placeholder="Enter maximum amount"
                      className="input pl-12"
                    />
                  </div>
                  <p className="text-xs text-muted">
                    We'll bid on your behalf just enough to keep you in the lead, up to your max.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={handlePlaceBid}
              disabled={isDisabled || !bidAmount}
              className="btn-primary w-full py-4 text-lg mt-2 shadow-orange/20 shadow-lg"
            >
              {isPlacingBid || proxy.isPlacing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Placing Bid...
                </>
              ) : (
                <span className="flex items-center gap-2">
                  <Gavel className="h-5 w-5" />
                  Place Bid
                </span>
              )}
            </button>

            {!isAuthenticated && (
              <p className="text-center text-xs font-medium text-error mt-2">
                You must log in to place a bid.
              </p>
            )}
            {isSeller && (
              <p className="text-center text-xs font-medium text-error mt-2">
                You cannot bid on your own auction.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
