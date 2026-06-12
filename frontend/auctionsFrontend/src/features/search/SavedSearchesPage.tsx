import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Trash2, Play, Search } from 'lucide-react';
import { useGetSavedSearchesQuery, useDeleteSavedSearchMutation } from '@/store/api/searchApi';
import { formatDistanceToNow } from 'date-fns';

export default function SavedSearchesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetSavedSearchesQuery({ page });
  const [deleteSearch] = useDeleteSavedSearchMutation();
  const navigate = useNavigate();

  const searches = data?.data ?? [];

  const handleRunSearch = (filters: Record<string, any>) => {
    const params = new URLSearchParams(filters);
    navigate(`/app/search?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-ink flex items-center gap-3">
          <Save className="h-7 w-7 text-muted" /> Saved Searches
        </h1>
        <p className="text-muted mt-1">Manage your saved queries and notification alerts.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-sky/50" />
          ))
        ) : searches.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-border bg-white p-12 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-muted/30" />
            <p className="font-medium text-ink">No saved searches yet.</p>
            <p className="text-sm text-muted mt-1">
              Search for items and click "Save this Search" to see them here.
            </p>
          </div>
        ) : (
          searches.map((saved) => (
            <div key={saved.id} className="flex flex-col justify-between rounded-2xl border border-border bg-white p-6 shadow-sm transition-all hover:border-orange/30 hover:shadow-md">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-display text-lg font-bold text-ink line-clamp-1">{saved.name}</h3>
                  <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-navy px-2 text-xs font-bold text-white">
                    {saved.resultCount}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {Object.entries(saved.filters).map(([k, v]) => (
                    <span key={k} className="inline-flex rounded bg-sky px-2 py-0.5 text-[10px] font-medium text-navy uppercase">
                      {k}: {v}
                    </span>
                  ))}
                </div>
                
                <p className="text-[10px] text-muted">
                  Created {formatDistanceToNow(new Date(saved.createdAt))} ago
                </p>
              </div>
              
              <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                <button 
                  onClick={() => deleteSearch(saved.id)}
                  className="rounded p-2 text-muted hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRunSearch(saved.filters)}
                  className="flex items-center gap-2 rounded-lg bg-orange px-4 py-2 text-sm font-bold text-white hover:bg-orange/90 transition-colors"
                >
                  <Play className="h-4 w-4" /> Run Now
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
