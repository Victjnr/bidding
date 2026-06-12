import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import { FilterSidebar } from './components/FilterSidebar';
import { SortBar } from './components/SortBar';
import { AuctionGrid } from './components/AuctionGrid';
import { useListAuctionsQuery } from '@/store/api/auctionApi';
import type { AuctionFilters } from '@/types/auction';

export default function AuctionListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Custom infinite logic state (since we use standard query in RTK for now)
  // For a real production app with RTK Query, we might use a custom slice to concatenate results.
  const [page, setPage] = useState(1);

  // Parse filters from URL
  const filters: AuctionFilters = useMemo(() => {
    return {
      category: searchParams.get('category') || undefined,
      type: searchParams.getAll('type') as any[],
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      condition: searchParams.getAll('condition'),
      endingSoon: searchParams.get('endingSoon') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'newest',
      page,
      limit: 12,
    };
  }, [searchParams, page]);

  // Using a standard query here. Note: this doesn't automatically concatenate previous pages in RTK Query without a custom merge.
  // We'll rely on the API to return the current page data.
  const { data, isLoading, isFetching } = useListAuctionsQuery(filters);

  // Update filters in URL
  const updateFilters = useCallback((newFilters: Partial<AuctionFilters>) => {
    setPage(1); // Reset page on filter change
    const params = new URLSearchParams(searchParams);
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.delete(key);
        value.forEach(v => params.append(key, String(v)));
      } else {
        params.set(key, String(value));
      }
    });
    
    setSearchParams(params);
  }, [searchParams, setSearchParams]);

  const loadMore = useCallback(() => {
    if (data?.meta && page < data.meta.lastPage) {
      setPage(p => p + 1);
    }
  }, [data, page]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Discover Auctions</h1>
          <p className="mt-1 text-sm text-muted">Find unique items from verified sellers worldwide.</p>
        </div>
        
        {/* Mobile filter toggle */}
        <button
          onClick={() => setMobileFiltersOpen(true)}
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-ink shadow-sm border border-border lg:hidden"
        >
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:gap-8">
        {/* Mobile Filter Overlay */}
        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileFiltersOpen(false)} />
            <div className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h2 className="text-lg font-bold">Filters</h2>
                <button onClick={() => setMobileFiltersOpen(false)} className="p-2 text-muted hover:text-ink">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterSidebar filters={filters} onFilterChange={updateFilters} className="border-0" />
            </div>
          </div>
        )}

        {/* Desktop Sidebar */}
        <div className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-24 rounded-xl shadow-sm overflow-hidden">
            <FilterSidebar filters={filters} onFilterChange={updateFilters} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <SortBar
            totalResults={data?.meta.total || 0}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            filters={filters}
            onFilterChange={updateFilters}
          />
          
          <AuctionGrid
            auctions={data?.data || []}
            isLoading={isLoading}
            isFetchingNextPage={isFetching && !isLoading && page > 1}
            hasNextPage={!!data && page < data.meta.lastPage}
            fetchNextPage={loadMore}
            viewMode={viewMode}
          />
        </div>
      </div>
    </div>
  );
}
