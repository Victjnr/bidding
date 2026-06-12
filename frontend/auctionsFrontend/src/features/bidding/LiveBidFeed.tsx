import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { History, Zap } from 'lucide-react';
import { useGetBidsQuery } from '@/store/api/auctionApi';

export function LiveBidFeed({ auctionUuid }: { auctionUuid: string }) {
  const { data: bids = [], isLoading } = useGetBidsQuery(auctionUuid);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to top when new bids arrive (since new bids are unshifted to the top)
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [bids]);

  if (isLoading) {
    return <div className="h-48 animate-pulse rounded-xl bg-sky/50" />;
  }

  if (bids.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white p-8 text-center">
        <History className="mb-2 h-8 w-8 text-muted/50" />
        <p className="text-sm font-medium text-ink">No bids yet</p>
        <p className="text-xs text-muted">Be the first to place a bid!</p>
      </div>
    );
  }

  // Show anti-snipe banner if the latest bid was placed very recently (e.g., within the last minute)
  // For UI simulation, we check if the first bid is less than a minute old.
  const latestBid = bids[0];
  const isSnipeExtension =
    latestBid && new Date().getTime() - new Date(latestBid.createdAt).getTime() < 60000;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Live Bid Feed</h3>
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-success"></span>
          </span>
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      </div>

      <AnimatePresence>
        {isSnipeExtension && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 rounded-md bg-orange/10 px-3 py-2 text-xs font-medium text-orange"
          >
            <Zap className="h-3.5 w-3.5" />
            Auction extended — bid placed in final minutes!
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={containerRef}
        className="max-h-[300px] overflow-y-auto pr-2 scrollbar-hide space-y-2"
      >
        <AnimatePresence initial={false}>
          {bids.map((bid, idx) => (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className="flex items-center justify-between rounded-lg border border-border bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">
                  {bid.bidderAlias.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-ink flex items-center gap-2">
                    {bid.bidderAlias}
                    {idx === 0 && (
                      <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-success">
                        Highest
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-orange">
                  ${bid.amount.toLocaleString()}
                </p>
                {bid.type === 'proxy' && (
                  <p className="text-[10px] font-medium text-muted uppercase">Auto-bid</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
