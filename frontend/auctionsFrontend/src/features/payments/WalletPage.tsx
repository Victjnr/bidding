import { useGetWalletBalanceQuery, useGetWalletLedgerQuery } from '@/store/api/paymentApi';
import { format } from 'date-fns';
import { Download, WalletCards, ShieldAlert, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export function WalletPage() {
  const { data: balance, isLoading: isBalanceLoading } = useGetWalletBalanceQuery();
  const [page, setPage] = useState(1);
  const { data: ledger, isLoading: isLedgerLoading } = useGetWalletLedgerQuery(page);

  const getBadgeColors = (type: string) => {
    switch (type) {
      case 'credit': return 'bg-success/10 text-success';
      case 'debit': return 'bg-error/10 text-error';
      case 'hold': return 'bg-navy/10 text-navy';
      case 'release': return 'bg-sky-500/10 text-sky-500';
      default: return 'bg-sky text-muted';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">My Wallet</h1>
          <p className="text-muted mt-1">Manage your funds, view holds, and track transactions.</p>
        </div>
        <button className="btn-outline gap-2 hidden sm:flex">
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-navy p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <WalletCards className="h-32 w-32" />
          </div>
          <p className="text-sky/80 font-medium tracking-wide uppercase text-sm">Available Balance</p>
          <div className="mt-2 text-4xl font-display font-bold">
            {isBalanceLoading ? '...' : `$${balance?.available?.toLocaleString() ?? '0.00'}`}
          </div>
          <button className="mt-6 text-sm font-medium text-orange hover:text-orange/80 flex items-center gap-1 transition-colors">
            Request Payout <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm relative overflow-hidden group">
          <div className="absolute right-4 top-4 text-muted/20 group-hover:text-muted/30 transition-colors">
            <ShieldAlert className="h-12 w-12" />
          </div>
          <p className="text-muted font-medium tracking-wide uppercase text-sm">On Hold (Escrow)</p>
          <div className="mt-2 text-3xl font-display font-bold text-ink">
            {isBalanceLoading ? '...' : `$${balance?.onHold?.toLocaleString() ?? '0.00'}`}
          </div>
          <p className="mt-4 text-xs text-muted">Funds secured until items are delivered</p>
        </div>

        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm relative overflow-hidden">
          <p className="text-muted font-medium tracking-wide uppercase text-sm">Total Earned</p>
          <div className="mt-2 text-3xl font-display font-bold text-ink">
            {isBalanceLoading ? '...' : `$${balance?.totalEarned?.toLocaleString() ?? '0.00'}`}
          </div>
          <p className="mt-4 text-xs text-success">Lifetime platform earnings</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-border bg-white shadow-sm overflow-hidden">
        <div className="border-b border-border px-6 py-4 flex justify-between items-center">
          <h2 className="font-display font-semibold text-ink">Transaction History</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-ink">
            <thead className="bg-sky/50 text-xs uppercase text-muted">
              <tr>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Description</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLedgerLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted">Loading transactions...</td>
                </tr>
              ) : ledger?.data?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted">No transactions found in this period.</td>
                </tr>
              ) : (
                ledger?.data?.map((entry) => (
                  <tr key={entry.id} className="hover:bg-sky/30 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4 font-medium">
                      {format(new Date(entry.createdAt), 'MMM d, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={entry.description}>
                      {entry.description}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold uppercase", getBadgeColors(entry.type))}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-display font-bold">
                      <span className={entry.type === 'debit' || entry.type === 'hold' ? 'text-error' : 'text-success'}>
                        {entry.type === 'debit' || entry.type === 'hold' ? '-' : '+'}${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${entry.balanceAfter.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination stub */}
        {ledger && ledger.meta.lastPage > 1 && (
          <div className="border-t border-border px-6 py-4 flex justify-between items-center bg-sky/20">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="btn-outline px-3 py-1 text-xs"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-muted">Page {page} of {ledger.meta.lastPage}</span>
            <button 
              disabled={page === ledger.meta.lastPage}
              onClick={() => setPage(p => p + 1)}
              className="btn-outline px-3 py-1 text-xs"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
