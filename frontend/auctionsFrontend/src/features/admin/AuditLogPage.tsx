import { useState } from 'react';
import { useGetAuditLogsQuery } from '@/store/api/adminApi';
import { Search, Eye, Filter, Download, ArrowRight, X } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import { cn } from '@/lib/utils';
import type { AuditLogEntry } from '@/types/admin';

export default function AuditLogPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  
  const { data: logs, isLoading } = useGetAuditLogsQuery({ page, search, action: actionFilter });
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const getActionColor = (action: string) => {
    if (action.includes('update') || action.includes('edit')) return 'text-sky-400 bg-sky-400/10';
    if (action.includes('delete') || action.includes('reject') || action.includes('ban')) return 'text-red-400 bg-red-400/10';
    if (action.includes('create') || action.includes('approve')) return 'text-emerald-400 bg-emerald-400/10';
    return 'text-orange bg-orange/10';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-white">Audit Log</h1>
          <p className="text-white/40 mt-1">Track all administrative actions across the platform.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors">
          <Download className="h-4 w-4 text-white/50" /> Export CSV
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 items-center rounded-xl border border-white/5 bg-[#0A1628] p-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <input
            type="text"
            placeholder="Search by actor or subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg bg-white/5 pl-9 pr-4 py-2 text-sm text-white placeholder:text-white/20 border border-white/5 focus:border-orange/50 focus:ring-1 focus:ring-orange/20 outline-none"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/20" />
          <select 
            value={actionFilter} 
            onChange={(e) => setActionFilter(e.target.value)} 
            className="rounded-lg bg-white/5 pl-9 pr-8 py-2 text-sm text-white border border-white/5 outline-none appearance-none cursor-pointer hover:bg-white/10"
          >
            <option value="">All Actions</option>
            <option value="create">Created</option>
            <option value="update">Updated</option>
            <option value="delete">Deleted</option>
            <option value="approve">Approved</option>
            <option value="reject">Rejected</option>
            <option value="suspend">Suspended</option>
            <option value="ban">Banned</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-xl border border-white/5 bg-[#0A1628] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.02] text-[10px] uppercase tracking-wider text-white/30">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Actor</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">IP Address</th>
                <th className="px-6 py-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30">Loading audit logs...</td></tr>
              ) : logs?.data.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-white/30">No logs found matching criteria.</td></tr>
              ) : (
                logs?.data.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-xs text-white/40">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{log.actorName}</p>
                      <p className="text-[10px] text-white/20 font-mono">{log.actorUuid.substring(0, 8)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("inline-flex rounded-md px-2 py-1 text-[10px] font-bold uppercase", getActionColor(log.action))}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-white/80">{log.subjectType}</p>
                      <p className="text-[10px] text-white/20 font-mono">{log.subjectId}</p>
                    </td>
                    <td className="px-6 py-4 text-xs text-white/40 font-mono">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center justify-center rounded-lg bg-white/5 p-2 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logs && logs.meta.lastPage > 1 && (
          <div className="border-t border-white/5 px-6 py-4 flex justify-between items-center">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">Previous</button>
            <span className="text-xs text-white/30">Page {page} of {logs.meta.lastPage}</span>
            <button disabled={page === logs.meta.lastPage} onClick={() => setPage(p => p + 1)} className="rounded-lg bg-white/5 px-3 py-1 text-xs text-white/50 hover:bg-white/10 disabled:opacity-30">Next</button>
          </div>
        )}
      </div>

      {/* Diff Viewer Modal */}
      <Dialog.Root open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null); }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm animate-in fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0A1628] p-6 shadow-2xl animate-in fade-in zoom-in-95 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Dialog.Title className="font-display text-xl font-bold text-white flex items-center gap-3">
                  Log Details
                  <span className={cn("rounded-md px-2 py-0.5 text-[10px] uppercase tracking-wider", getActionColor(selectedLog?.action ?? ''))}>
                    {selectedLog?.action}
                  </span>
                </Dialog.Title>
                <Dialog.Description className="text-xs text-white/40 mt-1">
                  {selectedLog && format(new Date(selectedLog.timestamp), 'MMMM d, yyyy HH:mm:ss')} by {selectedLog?.actorName}
                </Dialog.Description>
              </div>
              <Dialog.Close asChild>
                <button className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
              {/* Context metadata */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm">
                <div>
                  <p className="text-white/30 text-[10px] uppercase font-bold mb-1">Subject</p>
                  <p className="text-white">{selectedLog?.subjectType}</p>
                  <p className="text-white/40 text-xs font-mono">{selectedLog?.subjectId}</p>
                </div>
                <div>
                  <p className="text-white/30 text-[10px] uppercase font-bold mb-1">Context</p>
                  <p className="text-white/60 text-xs">IP: <span className="font-mono text-white/80">{selectedLog?.ip}</span></p>
                  <p className="text-white/60 text-xs">Actor ID: <span className="font-mono text-white/80">{selectedLog?.actorUuid}</span></p>
                </div>
              </div>

              {/* Diff Viewer */}
              {selectedLog?.oldValues || selectedLog?.newValues ? (
                <div>
                  <p className="text-white/30 text-[10px] uppercase font-bold mb-3">State Changes</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] overflow-hidden">
                      <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/10 text-xs font-bold text-red-400">Previous State</div>
                      <pre className="p-4 text-xs font-mono text-red-200/70 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.oldValues ? JSON.stringify(selectedLog.oldValues, null, 2) : 'null'}
                      </pre>
                    </div>
                    
                    <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] overflow-hidden">
                      <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/10 text-xs font-bold text-emerald-400">New State</div>
                      <pre className="p-4 text-xs font-mono text-emerald-200/70 overflow-x-auto whitespace-pre-wrap">
                        {selectedLog.newValues ? JSON.stringify(selectedLog.newValues, null, 2) : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-white/20 text-sm">
                  No state changes recorded for this action.
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
