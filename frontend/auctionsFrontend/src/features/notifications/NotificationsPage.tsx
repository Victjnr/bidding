import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import { Bell, Gavel, Trophy, CreditCard, AlertCircle, Info, CheckCheck, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useGetNotificationsQuery, useMarkNotificationReadMutation, useMarkAllNotificationsReadMutation } from '@/store/api/notificationApi';
import type { NotificationType } from '@/types';
import { cn } from '@/lib/utils';

const typeIconMap: Record<string, React.ReactNode> = {
  bid_placed: <Gavel className="h-4 w-4 text-orange" />,
  outbid: <Gavel className="h-4 w-4 text-orange" />,
  auction_won: <Trophy className="h-4 w-4 text-success" />,
  auction_ended: <Info className="h-4 w-4 text-muted" />,
  payment_received: <CreditCard className="h-4 w-4 text-success" />,
  payment_failed: <CreditCard className="h-4 w-4 text-error" />,
  dispute_opened: <AlertCircle className="h-4 w-4 text-error" />,
  dispute_resolved: <AlertCircle className="h-4 w-4 text-success" />,
  kyc_approved: <Info className="h-4 w-4 text-success" />,
  kyc_rejected: <Info className="h-4 w-4 text-error" />,
  message_received: <Info className="h-4 w-4 text-navy" />,
  system: <Info className="h-4 w-4 text-muted" />,
};

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'bids', label: 'Bids' },
  { value: 'payments', label: 'Payments' },
  { value: 'disputes', label: 'Disputes' },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useGetNotificationsQuery({ page, filter: activeTab });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = data?.data ?? [];

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkSelectedRead = async () => {
    for (const id of selectedIds) {
      await markRead(id).unwrap();
    }
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Notifications</h1>
          <p className="text-muted mt-1">Stay on top of your bids, payments, and disputes.</p>
        </div>
        <button
          onClick={() => markAllRead()}
          className="btn-outline gap-2 text-sm"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      <Tabs.Root value={activeTab} onValueChange={(v) => { setActiveTab(v); setPage(1); }}>
        <Tabs.List className="flex gap-1 rounded-lg bg-sky p-1">
          {TABS.map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all',
                activeTab === tab.value
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-muted hover:text-ink',
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-between rounded-lg bg-navy px-4 py-2 text-sm text-white"
          >
            <span>{selectedIds.size} selected</span>
            <button onClick={handleMarkSelectedRead} className="flex items-center gap-1 font-medium text-orange hover:text-orange/80">
              <Check className="h-4 w-4" /> Mark selected read
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification list */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-sky/50" />
          ))
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-white p-12 text-center">
            <Bell className="mx-auto mb-3 h-10 w-10 text-muted/30" />
            <p className="font-medium text-ink">No notifications</p>
            <p className="text-sm text-muted mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <motion.div
              key={notification.id}
              layout
              className={cn(
                'flex items-start gap-4 rounded-xl border bg-white p-4 transition-colors hover:shadow-sm cursor-pointer',
                !notification.read_at ? 'border-orange/20 bg-orange/[0.02]' : 'border-border',
              )}
              onClick={() => {
                if (!notification.read_at) markRead(notification.id);
              }}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelected(notification.id);
                }}
                className={cn(
                  'mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all',
                  selectedIds.has(notification.id)
                    ? 'border-orange bg-orange text-white'
                    : 'border-border hover:border-orange/50',
                )}
              >
                {selectedIds.has(notification.id) && <Check className="h-3 w-3" />}
              </button>

              {/* Icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky">
                {typeIconMap[notification.type] || <Info className="h-4 w-4 text-muted" />}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn('text-sm', !notification.read_at ? 'font-bold text-ink' : 'font-medium text-ink')}>
                    {notification.title}
                  </p>
                  {!notification.read_at && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-orange" />
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted line-clamp-2">{notification.body}</p>
                <p className="mt-1 text-xs text-muted/70">
                  {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                </p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.meta.last_page > 1 && (
        <div className="flex justify-between items-center pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="btn-outline px-4 py-2 text-sm"
          >
            Previous
          </button>
          <span className="text-xs font-medium text-muted">
            Page {page} of {data.meta.lastPage}
          </span>
          <button
            disabled={page === data.meta.lastPage || isLoading}
            onClick={() => setPage((p) => p + 1)}
            className="btn-outline px-4 py-2 text-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
