import { useState } from 'react';
import { useGetPendingAuctionsQuery, useApproveAuctionMutation, useRejectAuctionMutation, useRequestAuctionChangesMutation } from '@/store/api/adminApi';
import { Check, X, MessageSquare, DollarSign, Tag, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import toast from 'react-hot-toast';

const TABS = ['pending', 'active', 'flagged', 'ended'] as const;

export default function AuctionModerationPage() {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>('pending');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGetPendingAuctionsQuery({ page, status: activeTab });
  const [approveAuction, { isLoading: isApproving }] = useApproveAuctionMutation();
  const [rejectAuction] = useRejectAuctionMutation();
  const [requestChanges] = useRequestAuctionChangesMutation();

  // Rejection modal state
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('prohibited_items');
  const [rejectNotes, setRejectNotes] = useState('');

  // Request changes modal state
  const [changesTarget, setChangesTarget] = useState<string | null>(null);
  const [changesNotes, setChangesNotes] = useState('');

  const handleApprove = async (uuid: string) => {
    try {
      await approveAuction(uuid).unwrap();
      toast.success('Auction approved and published live!');
    } catch {
      toast.error('Failed to approve auction.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectAuction({ uuid: rejectTarget, reason: `${rejectReason}: ${rejectNotes}` }).unwrap();
      toast.success('Auction rejected.');
      setRejectTarget(null);
      setRejectNotes('');
    } catch {
      toast.error('Failed to reject auction.');
    }
  };

  const handleRequestChanges = async () => {
    if (!changesTarget) return;
    try {
      await requestChanges({ uuid: changesTarget, notes: changesNotes }).unwrap();
      toast.success('Changes requested from seller.');
      setChangesTarget(null);
      setChangesNotes('');
    } catch {
      toast.error('Failed to request changes.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">Auction Moderation</h1>
        <p className="text-white/40 mt-1">Review, approve, and flag auction listings.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-white/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setPage(1); }}
            className={cn(
              "flex-1 rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors",
              activeTab === tab ? "bg-orange text-white shadow-sm" : "text-white/40 hover:text-white/70"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 animate-pulse rounded-2xl bg-white/5" />)
        ) : data?.data.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <p className="text-lg font-bold text-white/50">No auctions in "{activeTab}" queue.</p>
          </div>
        ) : (
          data?.data.map((auction) => (
            <div key={auction.uuid} className="flex flex-col rounded-2xl border border-white/5 bg-[#0A1628] overflow-hidden">
              {/* Image */}
              <div className="h-40 bg-white/5 relative">
                {auction.imageUrl ? (
                  <img src={auction.imageUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/10 text-sm">No Image</div>
                )}
                <div className="absolute top-3 right-3">
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", {
                    'bg-amber-400/20 text-amber-400': auction.status === 'pending',
                    'bg-emerald-400/20 text-emerald-400': auction.status === 'approved',
                    'bg-red-400/20 text-red-400': auction.status === 'rejected',
                    'bg-orange/20 text-orange': auction.status === 'changes_requested',
                  })}>
                    {auction.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 p-5 space-y-3">
                <h3 className="font-display font-bold text-white text-lg line-clamp-1">{auction.title}</h3>
                <div className="space-y-1.5 text-xs text-white/40">
                  <p className="flex items-center gap-2"><User className="h-3 w-3" /> {auction.sellerName}</p>
                  <p className="flex items-center gap-2"><Tag className="h-3 w-3" /> {auction.category}</p>
                  <p className="flex items-center gap-2"><DollarSign className="h-3 w-3" /> Start: ${auction.startPrice.toLocaleString()} {auction.reservePrice ? `· Reserve: $${auction.reservePrice.toLocaleString()}` : ''}</p>
                </div>
                <p className="text-[10px] text-white/20">Submitted {formatDistanceToNow(new Date(auction.submittedAt))} ago</p>
              </div>

              {/* Actions (only show for pending) */}
              {activeTab === 'pending' && (
                <div className="border-t border-white/5 p-4 flex gap-2">
                  <button
                    onClick={() => handleApprove(auction.uuid)}
                    disabled={isApproving}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-emerald-500/10 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectTarget(auction.uuid)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-red-500/10 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => setChangesTarget(auction.uuid)}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/10 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Changes
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Rejection Reason Modal */}
      <Dialog.Root open={!!rejectTarget} onOpenChange={(open) => { if (!open) setRejectTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <Dialog.Title className="font-display text-xl font-bold text-white mb-1">Reject Auction</Dialog.Title>
            <Dialog.Description className="text-sm text-white/40 mb-4">Provide a reason for rejecting this listing.</Dialog.Description>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60">Reason</label>
                <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none">
                  <option value="prohibited_items">Prohibited Items</option>
                  <option value="misleading_description">Misleading Description</option>
                  <option value="duplicate_listing">Duplicate Listing</option>
                  <option value="policy_violation">Policy Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/60">Additional Notes</label>
                <textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} className="mt-1 w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none min-h-[80px] resize-none" placeholder="Optional details..." />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Dialog.Close asChild><button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/50 hover:bg-white/10">Cancel</button></Dialog.Close>
                <button onClick={handleReject} className="rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600">Reject Auction</button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Request Changes Modal */}
      <Dialog.Root open={!!changesTarget} onOpenChange={(open) => { if (!open) setChangesTarget(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <Dialog.Title className="font-display text-xl font-bold text-white mb-1">Request Changes</Dialog.Title>
            <Dialog.Description className="text-sm text-white/40 mb-4">Describe the changes the seller needs to make.</Dialog.Description>
            <div className="space-y-4">
              <textarea value={changesNotes} onChange={(e) => setChangesNotes(e.target.value)} className="w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white border border-white/5 outline-none min-h-[120px] resize-none" placeholder="e.g., Please add clearer photos of the item condition..." />
              <div className="flex justify-end gap-3">
                <Dialog.Close asChild><button className="rounded-lg bg-white/5 px-4 py-2 text-sm text-white/50 hover:bg-white/10">Cancel</button></Dialog.Close>
                <button onClick={handleRequestChanges} className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-white hover:bg-amber-600">Send Request</button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
