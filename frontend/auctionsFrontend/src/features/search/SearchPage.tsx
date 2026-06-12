import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { SlidersHorizontal, X, Save, Clock, Trash2, Play } from 'lucide-react';
import { useListAuctionsQuery } from '@/store/api/auctionApi';
import { useGetSearchFacetsQuery, useCreateSavedSearchMutation } from '@/store/api/searchApi';
import { AuctionCard } from '@/components/shared/AuctionCard';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Extract all filters from URL
  const filters = Object.fromEntries(searchParams.entries());
  const query = filters.q || '';
  
  const { data: auctionsData, isLoading } = useListAuctionsQuery({ ...filters });
  const { data: facets } = useGetSearchFacetsQuery(filters);

  const auctions = auctionsData?.data ?? [];

  const removeFilter = (key: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.delete(key);
    if (key === 'q') newParams.delete('q'); // Clearing search query
    setSearchParams(newParams);
  };

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (newParams.get(key) === value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    setSearchParams(newParams);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Mobile filter toggle */}
      <div className="md:hidden flex justify-between items-center w-full mb-4">
        <h1 className="font-display text-xl font-bold">Search Results</h1>
        <button 
          onClick={() => setIsMobileSidebarOpen(true)}
          className="btn-outline px-3 py-1.5 text-sm gap-2"
        >
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </button>
      </div>

      {/* Sidebar Filters */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-full bg-white p-6 md:static md:block md:w-64 md:shrink-0 md:bg-transparent md:p-0 transition-transform transform md:translate-x-0 overflow-y-auto",
        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between md:hidden mb-6">
          <h2 className="font-display font-bold text-lg">Filters</h2>
          <button onClick={() => setIsMobileSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-8">
          <SaveSearchButton filters={filters} />

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Categories</h3>
            <div className="space-y-2">
              {facets?.categories?.map((facet) => (
                <label key={facet.value} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={searchParams.get('category') === facet.value}
                    onChange={() => updateFilter('category', facet.value)}
                    className="rounded border-border text-orange focus:ring-orange/30"
                  />
                  <span className={cn("text-sm transition-colors", searchParams.get('category') === facet.value ? "text-orange font-medium" : "text-ink group-hover:text-orange")}>
                    {facet.label} <span className="text-muted text-xs">({facet.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted mb-3">Condition</h3>
            <div className="space-y-2">
              {facets?.conditions?.map((facet) => (
                <label key={facet.value} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={searchParams.get('condition') === facet.value}
                    onChange={() => updateFilter('condition', facet.value)}
                    className="rounded border-border text-orange focus:ring-orange/30"
                  />
                  <span className={cn("text-sm transition-colors", searchParams.get('condition') === facet.value ? "text-orange font-medium" : "text-ink group-hover:text-orange")}>
                    {facet.label} <span className="text-muted text-xs">({facet.count})</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Results */}
      <div className="flex-1 space-y-6">
        <div className="hidden md:flex justify-between items-center">
          <h1 className="font-display text-3xl font-bold text-ink">
            {query ? `Results for "${query}"` : 'All Auctions'}
            <span className="ml-3 text-lg font-medium text-muted">({auctionsData?.meta.total ?? 0})</span>
          </h1>
          <select 
            className="input w-auto text-sm py-1.5"
            value={searchParams.get('sort') || 'relevance'}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            <option value="relevance">Sort by Relevance</option>
            <option value="ending_soon">Ending Soonest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="most_bids">Most Bids</option>
          </select>
        </div>

        {/* Active Filter Pills */}
        {Object.keys(filters).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(filters).map(([key, value]) => {
              if (key === 'page' || key === 'sort') return null;
              return (
                <motion.span 
                  key={key}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky px-3 py-1 text-xs font-medium text-navy"
                >
                  <span className="capitalize">{key}:</span> {value}
                  <button onClick={() => removeFilter(key)} className="hover:text-orange"><X className="h-3 w-3" /></button>
                </motion.span>
              );
            })}
            {Object.keys(filters).length > 0 && (
              <button 
                onClick={() => setSearchParams(new URLSearchParams())}
                className="text-xs font-medium text-orange hover:underline ml-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}

        {/* Results Grid */}
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-sky/50" />
            ))
          ) : auctions.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <p className="font-display text-xl font-bold text-ink">No exact matches found.</p>
              <p className="text-muted mt-2">Try broadening your search or saving this search to be notified when items match.</p>
            </div>
          ) : (
            auctions.map((auction: any) => (
              <AuctionCard key={auction.uuid} auction={auction} variant="grid" />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SaveSearchButton({ filters }: { filters: Record<string, string> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [saveSearch, { isLoading }] = useCreateSavedSearchMutation();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveSearch({ name, filters }).unwrap();
      setIsOpen(false);
      setName('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange/30 bg-orange/5 px-4 py-3 text-sm font-bold text-orange transition-colors hover:bg-orange/10">
          <Save className="h-4 w-4" /> Save this Search
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy/40 backdrop-blur-sm animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95">
          <Dialog.Title className="font-display text-xl font-bold text-ink mb-1">Save Search</Dialog.Title>
          <Dialog.Description className="text-sm text-muted mb-4">
            Get notified when new auctions match your current filters.
          </Dialog.Description>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-ink">Search Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="input mt-1" 
                placeholder="e.g., Vintage Rolex Watches" 
                autoFocus 
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Dialog.Close asChild>
                <button type="button" className="btn-outline px-4 py-2 text-sm">Cancel</button>
              </Dialog.Close>
              <button type="submit" disabled={!name.trim() || isLoading} className="btn-primary px-4 py-2 text-sm">
                {isLoading ? 'Saving...' : 'Save Search'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
