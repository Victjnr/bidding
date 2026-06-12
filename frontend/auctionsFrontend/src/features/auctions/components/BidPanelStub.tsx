import { Gavel } from 'lucide-react';
import type { AuctionResource } from '@/types/auction';

export function BidPanelStub({ auction }: { auction: AuctionResource }) {
  return (
    <div className="rounded-xl border border-border bg-white shadow-elevated overflow-hidden">
      <div className="bg-navy p-4 text-white text-center">
        <h3 className="font-display text-lg font-bold">Live Bid Panel</h3>
        <p className="text-xs text-sky opacity-80">Connected via WebSockets</p>
      </div>
      
      <div className="p-6 text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange/10 text-orange">
            <Gavel className="h-8 w-8" />
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium text-muted uppercase tracking-wider mb-1">Current Price</p>
          <p className="font-display text-3xl font-bold text-ink">
            {auction.currency} {auction.currentPrice.toLocaleString()}
          </p>
        </div>

        <div className="rounded-md bg-sky p-3 text-sm text-navy">
          <p><strong>Next Minimum Bid:</strong> {auction.currency} {(auction.currentPrice + (typeof auction.bidIncrement === 'number' ? auction.bidIncrement : 0)).toLocaleString()}</p>
        </div>

        <button className="btn-primary w-full py-3 text-base" disabled>
          Place Bid (Coming Soon)
        </button>

        <p className="text-xs text-muted mt-4">
          The full interactive bidding engine will be implemented in the Bidding module (M3).
        </p>
      </div>
    </div>
  );
}
