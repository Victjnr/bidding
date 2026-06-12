import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetSellerListingsQuery, useBulkUpdateListingsMutation } from '@/store/api/sellerApi';
import { Plus, Download, MoreHorizontal, Ban, RefreshCw, Eye, Edit2, Search } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export function ListingsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  
  const navigate = useNavigate();
  const { data: listings, isLoading } = useGetSellerListingsQuery({ page, status: statusFilter !== 'all' ? statusFilter : undefined });
  const [bulkUpdate, { isLoading: isUpdating }] = useBulkUpdateListingsMutation();

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && listings?.data) {
      setSelectedIds(new Set(listings.data.map(l => l.uuid)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (uuid: string) => {
    const next = new Set(selectedIds);
    if (next.has(uuid)) next.delete(uuid);
    else next.add(uuid);
    setSelectedIds(next);
  };

  const handleBulkAction = async (action: 'cancel' | 'relist') => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to ${action} ${selectedIds.size} listings?`)) {
      await bulkUpdate({ uuids: Array.from(selectedIds), action }).unwrap();
      setSelectedIds(new Set());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'pending': return 'bg-amber-500/10 text-amber-500';
      case 'ended': return 'bg-navy/10 text-navy';
      case 'sold': return 'bg-orange/10 text-orange';
      default: return 'bg-muted/10 text-muted'; // draft, cancelled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Listings</h1>
          <p className="text-muted mt-1">Manage your auctions and track their performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-outline gap-2 hidden sm:flex">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button onClick={() => navigate('/app/sell')} className="btn-primary gap-2">
            <Plus className="h-4 w-4" /> New Listing
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-border p-4 flex flex-col sm:flex-row gap-4 items-center justify-between bg-sky/30">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                placeholder="Search listings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-sm h-9 w-full bg-white border-border"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input text-sm h-9 py-1 w-32 border-border bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="ended">Ended</option>
              <option value="sold">Sold</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-orange/10 px-3 py-1.5 rounded-lg border border-orange/20">
              <span className="text-sm font-bold text-orange">{selectedIds.size} selected</span>
              <div className="h-4 w-px bg-orange/30 mx-1" />
              <button 
                onClick={() => handleBulkAction('cancel')}
                disabled={isUpdating}
                className="text-xs font-medium text-ink hover:text-error transition-colors flex items-center gap-1"
              >
                <Ban className="h-3 w-3" /> Cancel
              </button>
              <button 
                onClick={() => handleBulkAction('relist')}
                disabled={isUpdating}
                className="text-xs font-medium text-ink hover:text-success transition-colors flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Relist
              </button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium w-12">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={listings?.data?.length > 0 && selectedIds.size === listings.data.length}
                    className="rounded border-border text-orange focus:ring-orange/30"
                  />
                </th>
                <th className="px-6 py-4 font-medium">Item Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Current Price</th>
                <th className="px-6 py-4 font-medium text-right">Bids</th>
                <th className="px-6 py-4 font-medium">Time Remaining</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted">Loading...</td></tr>
              ) : listings?.data?.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-muted">No listings found matching your filters.</td></tr>
              ) : (
                listings?.data?.map((auction) => (
                  <tr key={auction.uuid} className="hover:bg-sky/30 transition-colors group">
                    <td className="px-6 py-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(auction.uuid)}
                        onChange={() => handleSelectOne(auction.uuid)}
                        className="rounded border-border text-orange focus:ring-orange/30"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={auction.media.find(m => m.isPrimary)?.cdnUrl || 'https://placehold.co/100x100/EBF4FD/6B7A8D?text=No+Image'} 
                          alt="" 
                          className="h-12 w-12 rounded-md object-cover border border-border" 
                        />
                        <div>
                          <p className="font-semibold text-ink line-clamp-1 max-w-[200px] sm:max-w-xs">{auction.title}</p>
                          <p className="text-[10px] text-muted">ID: {auction.uuid.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", getStatusBadge(auction.status))}>
                        {auction.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold text-ink">
                      ${auction.currentPrice.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-muted">
                      {auction.totalBids}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs">
                      {auction.status === 'active' || auction.status === 'pending' 
                        ? formatDistanceToNow(new Date(auction.endAt))
                        : format(new Date(auction.endAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1.5 text-muted hover:text-ink hover:bg-sky rounded outline-none focus:ring-2 focus:ring-orange/50">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content align="end" sideOffset={5} className="z-50 w-48 rounded-xl border border-border bg-white p-1.5 shadow-elevated animate-in fade-in zoom-in-95">
                            <DropdownMenu.Item onSelect={() => navigate(`/app/auctions/${auction.uuid}`)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sky cursor-pointer outline-none">
                              <Eye className="h-4 w-4 text-muted" /> View Listing
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onSelect={() => navigate(`/app/sell?edit=${auction.uuid}`)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sky cursor-pointer outline-none">
                              <Edit2 className="h-4 w-4 text-muted" /> Edit Details
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-border" />
                            {auction.status === 'active' ? (
                              <DropdownMenu.Item className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-error hover:bg-error/10 cursor-pointer outline-none">
                                <Ban className="h-4 w-4" /> Cancel Auction
                              </DropdownMenu.Item>
                            ) : (
                              <DropdownMenu.Item className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink hover:bg-sky cursor-pointer outline-none">
                                <RefreshCw className="h-4 w-4 text-muted" /> Relist Item
                              </DropdownMenu.Item>
                            )}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination stub */}
        {listings && listings.meta.lastPage > 1 && (
          <div className="border-t border-border px-6 py-4 flex justify-between items-center bg-sky/20">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-outline px-3 py-1 text-xs">Previous</button>
            <span className="text-xs font-medium text-muted">Page {page} of {listings.meta.lastPage}</span>
            <button disabled={page === listings?.meta?.lastPage || isLoading} onClick={() => setPage(p => p + 1)} className="btn-outline px-3 py-1 text-xs">Next</button>
          </div>
        )}
      </div>
    </div>
  );
}
