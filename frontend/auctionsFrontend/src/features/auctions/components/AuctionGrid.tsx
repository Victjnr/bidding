import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { SearchX, Loader2 } from 'lucide-react';
import { AuctionCard } from '@/components/shared/AuctionCard';
import { cn } from '@/lib/utils';
import type { AuctionResource } from '@/types/auction';

interface AuctionGridProps {
  auctions: AuctionResource[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  viewMode: 'grid' | 'list';
  onClick?: (auction: AuctionResource) => void;
}

export function AuctionGrid({
  auctions,
  isLoading,
  isFetchingNextPage,
  hasNextPage,
  fetchNextPage,
  viewMode,
  onClick,
}: AuctionGridProps) {
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-white p-4 shadow-sm h-[320px] animate-pulse">
            <div className="h-40 w-full rounded-md bg-sky mb-4"></div>
            <div className="h-4 w-3/4 rounded bg-sky mb-2"></div>
            <div className="h-4 w-1/2 rounded bg-sky mb-6"></div>
            <div className="h-8 w-1/3 rounded bg-sky mt-auto"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!isLoading && auctions.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-white/50 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky text-muted mb-4">
          <SearchX className="h-8 w-8" />
        </div>
        <h3 className="font-display text-lg font-semibold text-ink">No auctions found</h3>
        <p className="mt-1 text-sm text-muted max-w-sm">
          We couldn't find any auctions matching your current filters. Try adjusting your search criteria or clearing filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={cn(
          "grid gap-6",
          viewMode === 'grid' ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}
      >
        {auctions.map((auction) => (
          <AuctionCard
            key={auction.uuid}
            auction={auction}
            variant={viewMode}
            onClick={onClick ? () => onClick(auction) : undefined}
          />
        ))}
      </div>

      {/* Infinite Scroll Trigger */}
      <div ref={ref} className="flex justify-center py-6">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        )}
        {!hasNextPage && auctions.length > 0 && (
          <p className="text-sm text-muted">You've reached the end of the list.</p>
        )}
      </div>
    </div>
  );
}
