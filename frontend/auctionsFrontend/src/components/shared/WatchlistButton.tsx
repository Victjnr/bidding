import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToggleWatchlistMutation } from '@/store/api/auctionApi';

interface WatchlistButtonProps {
  auctionUuid: string;
  initialCount?: number;
  initialIsWatched?: boolean;
}

export function WatchlistButton({ auctionUuid, initialCount = 0, initialIsWatched = false }: WatchlistButtonProps) {
  const [toggleWatchlist] = useToggleWatchlistMutation();
  const [isWatched, setIsWatched] = useState(initialIsWatched);
  const [count, setCount] = useState(initialCount);

  const handleToggle = async () => {
    const newIsWatched = !isWatched;
    setIsWatched(newIsWatched);
    setCount((c) => (newIsWatched ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await toggleWatchlist(auctionUuid).unwrap();
      if (typeof res?.isWatched === 'boolean') {
        setIsWatched(res.isWatched);
      }
      if (typeof res?.watchersCount === 'number') {
        setCount(res.watchersCount);
      }
    } catch {
      setIsWatched(isWatched);
      setCount(count);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "btn-outline flex-1 gap-2 border-border transition-colors",
        isWatched && "bg-orange/5 border-orange/30 text-orange hover:bg-orange/10 hover:text-orange"
      )}
    >
      <Heart className={cn("h-4 w-4 transition-transform", isWatched && "fill-orange text-orange scale-110")} />
      {isWatched ? 'Watching' : 'Watchlist'}
      <span className="ml-1 rounded-full bg-sky px-2 py-0.5 text-xs font-medium text-muted">
        {count}
      </span>
    </button>
  );
}
