import { useState } from 'react';
import { useGetWatchlistQuery, useUpdateWatchlistPreferencesMutation } from '@/store/api/accountApi';
import { EyeOff, Clock, Bell, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import * as Popover from '@radix-ui/react-popover';

export default function WatchlistPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetWatchlistQuery({ page });
  const [updatePrefs] = useUpdateWatchlistPreferencesMutation();

  const handleTogglePref = (uuid: string, currentPrefs: any, key: 'notifyEndingSoon' | 'notifyOutbid') => {
    updatePrefs({
      auctionUuid: uuid,
      preferences: { ...currentPrefs, [key]: !currentPrefs[key] }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Watchlist</h2>
        <p className="text-sm text-muted mt-1">Auctions you're keeping an eye on.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-64 animate-pulse rounded-xl bg-sky/50" />)
        ) : data?.data.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-xl border-2 border-dashed border-border bg-sky/20">
            <EyeOff className="mx-auto mb-3 h-8 w-8 text-muted" />
            <p className="font-medium text-ink">Your watchlist is empty</p>
            <p className="text-sm text-muted mt-1">Click the heart icon on any auction to save it here.</p>
            <Link to="/app/auctions" className="btn-primary mt-4 inline-flex">Explore Auctions</Link>
          </div>
        ) : (
          data?.data.map(auction => (
            <div key={auction.uuid} className="group relative flex flex-col rounded-xl border border-border bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
              <Link to={`/app/auctions/${auction.uuid}`} className="h-40 bg-sky relative overflow-hidden block">
                {auction.media?.[0]?.cdnUrl ? (
                  <img src={auction.media[0].cdnUrl} alt={auction.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="flex h-full items-center justify-center text-muted">No Image</div>
                )}
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/60 px-2 py-1 text-[10px] font-bold text-white backdrop-blur-md">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(auction.endAt))}
                </div>
              </Link>

              <div className="flex flex-col flex-1 p-4">
                <Link to={`/app/auctions/${auction.uuid}`} className="font-display font-bold text-ink hover:text-orange line-clamp-1 mb-1">
                  {auction.title}
                </Link>
                <div className="flex justify-between items-end mt-auto pt-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted tracking-wider">Current Bid</p>
                    <p className="font-display font-bold text-lg text-ink">${auction.currentPrice.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Popover.Root>
                      <Popover.Trigger asChild>
                        <button className="rounded-lg p-2 text-muted hover:bg-sky hover:text-ink transition-colors" title="Notification Preferences">
                          <Bell className="h-4 w-4" />
                        </button>
                      </Popover.Trigger>
                      <Popover.Portal>
                        <Popover.Content align="end" sideOffset={5} className="z-50 w-56 rounded-xl border border-border bg-white p-3 shadow-xl animate-in fade-in zoom-in-95">
                          <p className="text-xs font-bold uppercase tracking-wider text-muted mb-2">Notifications</p>
                          <div className="space-y-2">
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-sm font-medium text-ink">Ending Soon</span>
                              <button onClick={() => handleTogglePref(auction.uuid, auction, 'notifyEndingSoon')} className={cn("relative h-5 w-9 rounded-full transition-colors", auction.notifyEndingSoon ? "bg-orange" : "bg-muted/30")}>
                                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", auction.notifyEndingSoon && "translate-x-4")} />
                              </button>
                            </label>
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-sm font-medium text-ink">Outbid</span>
                              <button onClick={() => handleTogglePref(auction.uuid, auction, 'notifyOutbid')} className={cn("relative h-5 w-9 rounded-full transition-colors", auction.notifyOutbid ? "bg-orange" : "bg-muted/30")}>
                                <span className={cn("absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform", auction.notifyOutbid && "translate-x-4")} />
                              </button>
                            </label>
                          </div>
                        </Popover.Content>
                      </Popover.Portal>
                    </Popover.Root>

                    <button className="rounded-lg p-2 text-error/60 hover:bg-error/10 hover:text-error transition-colors" title="Remove from Watchlist">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
