import { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Gavel, Trophy, CreditCard, AlertCircle, Info, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { selectNotifications, selectUnreadCount, markAsRead, markAllAsRead } from '@/store/slices/notificationsSlice';
import { useNotificationRoom } from '@/hooks/useNotificationRoom';
import type { NotificationType } from '@/types';

const ICON_MAP: Record<string, React.ReactNode> = {
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

function getNotificationRoute(type: NotificationType, data: Record<string, unknown>): string {
  switch (type) {
    case 'bid_placed':
    case 'outbid':
    case 'auction_won':
    case 'auction_ended':
      return `/app/auctions/${data.auctionUuid || ''}`;
    case 'payment_received':
    case 'payment_failed':
      return '/app/wallet';
    case 'dispute_opened':
    case 'dispute_resolved':
      return '/app/wallet';
    case 'message_received':
      return `/app/messages/${data.conversationId || ''}`;
    default:
      return '/app/notifications';
  }
}

export function NotificationBell() {
  useNotificationRoom();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const [isOpen, setIsOpen] = useState(false);

  const latestTen = notifications.slice(0, 10);

  const handleClickNotification = (notification: (typeof notifications)[0]) => {
    if (!notification.read_at) {
      dispatch(markAsRead(notification.id));
    }
    setIsOpen(false);
    navigate(getNotificationRoute(notification.type, notification.data));
  };

  const handleMarkAllRead = () => {
    dispatch(markAllAsRead());
  };

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative rounded-lg p-2 text-muted transition-colors hover:bg-sky hover:text-ink"
          aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
          id="notifications-bell"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key={unreadCount}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange px-1 text-[10px] font-bold text-white"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[320px] rounded-xl border border-border bg-white shadow-elevated animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="font-display text-sm font-bold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs font-medium text-orange hover:text-orange/80 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
            {latestTen.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto mb-2 h-8 w-8 text-muted/30" />
                <p className="text-sm text-muted">No notifications yet</p>
              </div>
            ) : (
              latestTen.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleClickNotification(notification)}
                  className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition-colors hover:bg-sky/50 last:border-b-0"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky">
                    <div className="mt-1">{ICON_MAP[notification.type] || <MessageSquare className="h-4 w-4 text-sky" />}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink line-clamp-1">{notification.title}</p>
                    <p className="mt-0.5 text-xs text-muted line-clamp-2">{notification.body}</p>
                    <p className="mt-1 text-[10px] text-muted/70">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.read_at && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-orange" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-4 py-2.5">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/app/notifications');
              }}
              className="w-full text-center text-xs font-medium text-orange hover:text-orange/80 transition-colors"
            >
              View all notifications →
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
