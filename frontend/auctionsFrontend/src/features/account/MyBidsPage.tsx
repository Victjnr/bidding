import { useState } from 'react';
import { useGetMyBidsQuery } from '@/store/api/accountApi';
import { Gavel, Clock, ArrowUpRight, Trophy, AlertCircle, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { AuctionResource } from '@/types/auction';

type BidStatusTab = 'active' | 'won' | 'lost' | 'all';

export default function MyBidsPage() {
  const [tab, setTab] = useState<BidStatusTab>('active');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetMyBidsQuery({ status: tab, page });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">My Bids</h2>
        <p className="text-sm text-muted mt-1">Track your active bids and past auction results.</p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(['active', 'won', 'lost', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2",
              tab === t ? "border-orange text-orange" : "border-transparent text-muted hover:text-ink hover:border-border"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-sky/50" />)
        ) : data?.data.length === 0 ? (
          <div className="py-12 text-center rounded-xl border-2 border-dashed border-border bg-sky/20">
            <Gavel className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="font-medium text-ink">No bids found</p>
            <p className="text-sm text-muted mt-1">You don't have any bids in this category.</p>
            <Link to="/app/auctions" className="btn-primary mt-4 inline-flex">Browse Auctions</Link>
          </div>
        ) : (
          data?.data.map(auction => (
            <CompactBidCard key={auction.uuid} auction={auction} tab={tab} />
          ))
        )}
      </div>

      {data && data.meta.lastPage > 1 && (
        <div className="flex justify-between items-center pt-4">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline px-3 py-1 text-xs">Previous</button>
          <span className="text-xs text-muted">Page {page} of {data.meta.lastPage}</span>
          <button disabled={page === data.meta.lastPage} onClick={() => setPage(p => p + 1)} className="btn-outline px-3 py-1 text-xs">Next</button>
        </div>
      )}
    </div>
  );
}

function CompactBidCard({ auction, tab }: { auction: AuctionResource & { bidStatus: string; myMaxBid: number }; tab: string }) {
  const isWinning = auction.bidStatus === 'highest';
  const isWon = auction.bidStatus === 'won';
  const isLost = auction.bidStatus === 'lost';

  return (
    <div className={cn("group flex flex-col sm:flex-row rounded-xl border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md", isWon ? "border-success/30" : "border-border")}>
      <div className="sm:w-48 h-32 sm:h-auto bg-sky shrink-0 overflow-hidden relative">
        {auction.media?.[0]?.cdnUrl ? (
          <img src={auction.media[0].cdnUrl} alt={auction.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="flex h-full items-center justify-center text-muted">No Image</div>
        )}
        {/* Status Chip */}
        <div className="absolute top-2 right-2 sm:left-2 sm:right-auto">
          {isWinning && <span className="rounded bg-success px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">Highest Bidder</span>}
          {auction.bidStatus === 'outbid' && <span className="rounded bg-orange px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">Outbid</span>}
          {isWon && <span className="flex items-center gap-1 rounded bg-success px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm"><Trophy className="h-3 w-3" /> Won</span>}
          {isLost && <span className="rounded bg-muted px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm">Lost</span>}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex justify-between items-start">
            <Link to={`/app/auctions/${auction.uuid}`} className="font-display font-bold text-lg text-ink hover:text-orange line-clamp-1">
              {auction.title}
            </Link>
            <span className="font-display font-bold text-lg whitespace-nowrap text-ink">${auction.currentPrice.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted mt-1">
            <p>Your Max Bid: <span className="font-bold text-ink">${auction.myMaxBid.toLocaleString()}</span></p>
            <p>•</p>
            <p className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {isWon || isLost ? 'Ended' : `Ends in ${formatDistanceToNow(new Date(auction.endAt))}`}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
          {isWon ? (
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-1.5 text-xs font-bold text-success"><CheckCircle2 className="h-4 w-4" /> Paid</span>
              <button className="btn-outline py-1.5 px-3 text-xs gap-1.5"><MessageSquare className="h-3.5 w-3.5" /> Leave Review</button>
            </div>
          ) : isLost ? (
            <p className="text-xs text-muted">Auction closed. Winning bid: ${auction.currentPrice.toLocaleString()}</p>
          ) : auction.bidStatus === 'outbid' ? (
            <Link to={`/app/auctions/${auction.uuid}`} className="btn-primary py-1.5 px-3 text-xs gap-1.5 ml-auto">
              Bid Higher <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <p className="text-xs font-medium text-success ml-auto">You hold the winning bid!</p>
          )}
        </div>
      </div>
    </div>
  );
}

// local dummy component for icon check
function CheckCircle2({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>;
}
