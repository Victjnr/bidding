import { useState, useCallback } from 'react';
import { Search, MoreHorizontal, Eye, Ban, UserX, UserCheck, X, Shield, Clock, CreditCard, Gavel } from 'lucide-react';
import { useGetAdminUsersQuery, useGetAdminUserDetailQuery, useSuspendUserMutation, useBanUserMutation } from '@/store/api/adminApi';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import type { AdminUserResource, KycTier, AdminUserStatus } from '@/types/admin';

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUserUuid, setSelectedUserUuid] = useState<string | null>(null);

  const { data: users, isLoading } = useGetAdminUsersQuery({ page, search, status: statusFilter, kycTier: kycFilter, role: roleFilter });
  const [suspendUser] = useSuspendUserMutation();
  const [banUser] = useBanUserMutation();

  const getStatusBadge = (status: AdminUserStatus) => {
    switch (status) {
      case 'active': return 'bg-emerald-400/10 text-emerald-400';
      case 'suspended': return 'bg-amber-400/10 text-amber-400';
      case 'banned': return 'bg-red-400/10 text-red-400';
      case 'pending': return 'bg-white/10 text-white/50';
    }
  };

  const getKycBadge = (tier: KycTier) => {
    switch (tier) {
      case 'enhanced': return 'bg-emerald-400/10 text-emerald-400';
      case 'verified': return 'bg-sky-400/10 text-sky-400';
      case 'basic': return 'bg-orange/10 text-orange';
      case 'none': return 'bg-white/5 text-white/30';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold text-white">User Management</h1>
        <p className="text-white/40 mt-1">View, moderate, and manage all platform accounts.</p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center rounded-xl border border-white/5 bg-[#0A1628] p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 border border-white/5 focus:border-orange/50 focus:ring-1 focus:ring-orange/20 outline-none"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60 border border-white/5 outline-none">
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="banned">Banned</option>
          <option value="pending">Pending</option>
        </select>
        <select value={kycFilter} onChange={(e) => setKycFilter(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60 border border-white/5 outline-none">
          <option value="">All KYC</option>
          <option value="enhanced">Enhanced</option>
          <option value="verified">Verified</option>
          <option value="basic">Basic</option>
          <option value="none">None</option>
        </select>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="rounded-lg bg-white/5 px-3 py-2 text-sm text-white/60 border border-white/5 outline-none">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="seller">Seller</option>
          <option value="buyer">Buyer</option>
        </select>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-white/5 bg-[#0A1628] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/30">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Roles</th>
                <th className="px-6 py-4 font-medium">KYC Tier</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Joined</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30">Loading users...</td></tr>
              ) : users?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30">No users match filters.</td></tr>
              ) : (
                users?.data.map((user) => (
                  <tr key={user.uuid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-sm font-bold text-orange">
                          {user.avatarPath ? (
                            <img src={user.avatarPath} alt="" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-xs text-white/30">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 flex-wrap">
                        {user.roles.map((role) => (
                          <span key={role} className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-bold uppercase text-white/50">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", getKycBadge(user.kycTier))}>
                        {user.kycTier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase", getStatusBadge(user.status))}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40">
                      {format(new Date(user.joinedAt), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1.5 text-white/30 hover:text-white hover:bg-white/5 rounded outline-none">
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content align="end" sideOffset={5} className="z-50 w-48 rounded-xl border border-white/10 bg-[#0A1628] p-1.5 shadow-2xl animate-in fade-in zoom-in-95">
                            <DropdownMenu.Item onSelect={() => setSelectedUserUuid(user.uuid)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 cursor-pointer outline-none">
                              <Eye className="h-4 w-4 text-white/30" /> View Details
                            </DropdownMenu.Item>
                            <DropdownMenu.Separator className="my-1 h-px bg-white/5" />
                            {user.status === 'active' && (
                              <DropdownMenu.Item onSelect={() => suspendUser(user.uuid)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-amber-400 hover:bg-amber-400/10 cursor-pointer outline-none">
                                <UserX className="h-4 w-4" /> Suspend
                              </DropdownMenu.Item>
                            )}
                            {user.status !== 'banned' && (
                              <DropdownMenu.Item onSelect={() => banUser(user.uuid)} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 cursor-pointer outline-none">
                                <Ban className="h-4 w-4" /> Ban User
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

        {/* Pagination */}
        {users && users.meta.lastPage > 1 && (
          <div className="border-t border-white/5 px-6 py-4 flex justify-between items-center">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">Previous</button>
            <span className="text-xs text-white/30">Page {page} of {users.meta.lastPage}</span>
            <button disabled={page === users.meta.lastPage} onClick={() => setPage(p => p + 1)} className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>

      {/* User Detail Drawer */}
      <AnimatePresence>
        {selectedUserUuid && (
          <UserDetailDrawer uuid={selectedUserUuid} onClose={() => setSelectedUserUuid(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDetailDrawer({ uuid, onClose }: { uuid: string; onClose: () => void }) {
  const { data: user, isLoading } = useGetAdminUserDetailQuery(uuid);

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 z-50 h-full w-full max-w-[480px] overflow-y-auto border-l border-white/5 bg-[#0A1628] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#0A1628] px-6 py-4">
          <h2 className="font-display text-lg font-bold text-white">User Details</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/30 hover:bg-white/5 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-20 rounded-xl bg-white/5" />
            <div className="h-40 rounded-xl bg-white/5" />
          </div>
        ) : user ? (
          <div className="p-6 space-y-6">
            {/* Profile Card */}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-6 text-center">
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-orange/10 text-2xl font-bold text-orange">
                {user.avatarPath ? <img src={user.avatarPath} alt="" className="h-full w-full rounded-full object-cover" /> : user.name.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-lg font-bold text-white">{user.name}</h3>
              <p className="text-xs text-white/40">{user.email}</p>
              <div className="mt-3 flex justify-center gap-2 flex-wrap">
                {user.roles.map((r) => <span key={r} className="rounded-md bg-orange/10 px-2 py-0.5 text-[10px] font-bold uppercase text-orange">{r}</span>)}
              </div>
            </div>

            {/* Transaction Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                <CreditCard className="mx-auto h-4 w-4 text-white/20 mb-1" />
                <p className="font-display text-lg font-bold text-white">${user.transactionSummary.totalSpent.toLocaleString()}</p>
                <p className="text-[9px] text-white/30 uppercase">Spent</p>
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                <CreditCard className="mx-auto h-4 w-4 text-white/20 mb-1" />
                <p className="font-display text-lg font-bold text-white">${user.transactionSummary.totalEarned.toLocaleString()}</p>
                <p className="text-[9px] text-white/30 uppercase">Earned</p>
              </div>
              <div className="rounded-lg bg-white/[0.02] border border-white/5 p-3 text-center">
                <Shield className="mx-auto h-4 w-4 text-white/20 mb-1" />
                <p className="font-display text-lg font-bold text-white">{user.transactionSummary.disputeCount}</p>
                <p className="text-[9px] text-white/30 uppercase">Disputes</p>
              </div>
            </div>

            {/* Login History */}
            <div>
              <h4 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" /> Login History
              </h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {user.loginHistory.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-2.5 border border-white/5 text-xs">
                    <div>
                      <p className="text-white/60">{entry.device}</p>
                      <p className="text-white/20">{entry.ip}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/40">{format(new Date(entry.time), 'MMM d, HH:mm')}</p>
                      <span className={cn("text-[10px] font-bold", entry.success ? "text-emerald-400" : "text-red-400")}>
                        {entry.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Bids */}
            <div>
              <h4 className="font-bold text-sm text-white/60 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Gavel className="h-4 w-4" /> Active Bids
              </h4>
              <div className="space-y-2">
                {user.activeBids.length === 0 ? (
                  <p className="text-xs text-white/20 text-center py-4">No active bids.</p>
                ) : (
                  user.activeBids.map((bid) => (
                    <div key={bid.auctionUuid} className="flex items-center justify-between rounded-lg bg-white/[0.02] px-4 py-2.5 border border-white/5">
                      <p className="text-xs text-white/60 truncate max-w-[200px]">{bid.auctionTitle}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">${bid.amount.toLocaleString()}</span>
                        {bid.isWinning && <span className="rounded bg-emerald-400/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">WINNING</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </motion.div>
    </>
  );
}
