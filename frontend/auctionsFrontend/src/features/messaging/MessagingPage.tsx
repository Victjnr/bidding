import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Send, ArrowLeft, MessageSquare } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useGetConversationsQuery, useGetMessagesQuery, useSendMessageMutation, useMarkConversationReadMutation } from '@/store/api/messagingApi';
import { useAppSelector, useAppDispatch } from '@/hooks/useRedux';
import { selectCurrentUser } from '@/store/slices/authSlice';
import { messagingApi } from '@/store/api/messagingApi';
import { cn } from '@/lib/utils';
import type { Message } from '@/types';

if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

export default function MessagingPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileShowThread(true);
  };

  const handleBack = () => {
    setMobileShowThread(false);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      {/* Left — Conversation List */}
      <div
        className={cn(
          'w-full shrink-0 border-r border-border lg:w-[320px]',
          mobileShowThread ? 'hidden lg:flex lg:flex-col' : 'flex flex-col',
        )}
      >
        <ConversationList
          activeId={activeConversationId}
          onSelect={handleSelectConversation}
        />
      </div>

      {/* Right — Message Thread */}
      <div
        className={cn(
          'flex flex-1 flex-col',
          !mobileShowThread ? 'hidden lg:flex' : 'flex',
        )}
      >
        {activeConversationId ? (
          <MessageThread
            conversationId={activeConversationId}
            onBack={handleBack}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center p-8">
            <MessageSquare className="mb-4 h-16 w-16 text-muted/20" />
            <h3 className="font-display text-xl font-bold text-ink">Select a conversation</h3>
            <p className="text-sm text-muted mt-1">Choose a conversation from the list to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Conversation List (Left Column)
   ═══════════════════════════════════════════════════ */

function ConversationList({
  activeId,
  onSelect,
}: {
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data: conversations = [], isLoading } = useGetConversationsQuery();
  const [search, setSearch] = useState('');

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.participants.some((p) => p.displayName.toLowerCase().includes(q)) ||
      (c.last_message?.body.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Search */}
      <div className="border-b border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="input pl-10 pr-4 text-sm bg-sky border-transparent focus:bg-white focus:border-orange"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-sky/70" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/3 rounded bg-sky/70" />
                <div className="h-2 w-full rounded bg-sky/50" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted">No conversations found.</p>
          </div>
        ) : (
          filtered.map((conversation) => {
            const otherParticipant = conversation.participants[0]; // Simplified
            return (
              <button
                key={conversation.id}
                onClick={() => onSelect(conversation.id)}
                className={cn(
                  'flex w-full items-start gap-3 border-b border-border/50 p-4 text-left transition-colors hover:bg-sky/50',
                  activeId === conversation.id && 'bg-sky/70',
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
                  {otherParticipant?.displayName?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-ink truncate">
                      {otherParticipant?.displayName ?? 'Unknown'}
                    </p>
                    <span className="text-[10px] text-muted/70 shrink-0 ml-2">
                      {conversation.last_message
                        ? formatDistanceToNow(new Date(conversation.last_message.created_at), { addSuffix: true })
                        : ''}
                    </span>
                  </div>
                  {conversation.auction_id && (
                    <p className="text-[10px] font-medium text-orange truncate">Re: Auction</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted truncate">
                    {conversation.last_message?.body ?? 'No messages yet'}
                  </p>
                </div>
                {conversation.unread_count > 0 && (
                  <span className="mt-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange px-1.5 text-[10px] font-bold text-white">
                    {conversation.unread_count}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Message Thread (Right Column)
   ═══════════════════════════════════════════════════ */

function MessageThread({
  conversationId,
  onBack,
}: {
  conversationId: string;
  onBack: () => void;
}) {
  const currentUser = useAppSelector(selectCurrentUser);
  const dispatch = useAppDispatch();
  const [page] = useState(1);
  const { data } = useGetMessagesQuery({ conversationId, page });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markRead] = useMarkConversationReadMutation();
  const [messageText, setMessageText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data?.data ?? [];

  // Mark conversation as read when opened
  useEffect(() => {
    markRead(conversationId);
  }, [conversationId, markRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Real-time: subscribe to conversation channel
  useEffect(() => {
    const echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
      forceTLS: true,
      authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
      },
    });

    echo.private(`conversation.${conversationId}`).listen('.NewMessage', (msg: Message) => {
      // Optimistically add to cache
      dispatch(
        messagingApi.util.updateQueryData('getMessages', { conversationId, page: 1 }, (draft) => {
          const exists = draft.data.find((m) => m.id === msg.id);
          if (!exists) {
            draft.data.push(msg);
          }
        }),
      );
    });

    return () => {
      echo.leave(`conversation.${conversationId}`);
      echo.disconnect();
    };
  }, [conversationId, dispatch, page]);

  const handleSend = async () => {
    const trimmed = messageText.trim();
    if (!trimmed || isSending) return;
    await sendMessage({ conversationId, body: trimmed }).unwrap();
    setMessageText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Thread Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={onBack}
          className="rounded-lg p-1.5 text-muted hover:bg-sky hover:text-ink lg:hidden"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">
          ?
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Conversation</p>
          <p className="text-[10px] text-muted">Auction Thread</p>
        </div>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center h-full text-center">
            <MessageSquare className="mb-2 h-10 w-10 text-muted/20" />
            <p className="text-sm text-muted">Start the conversation.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isOwn = msg.sender_id === currentUser?.uuid;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                      isOwn
                        ? 'bg-navy text-white rounded-br-md'
                        : 'bg-sky text-ink rounded-bl-md',
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                    <p className={cn('mt-1 text-[10px]', isOwn ? 'text-white/50' : 'text-muted/70')}>
                      {format(new Date(msg.created_at), 'h:mm a')}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <div className="relative flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value.slice(0, 500))}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="input min-h-[42px] max-h-[120px] resize-none pr-14 text-sm"
            />
            <span className="absolute bottom-2 right-3 text-[10px] text-muted/60">
              {messageText.length}/500
            </span>
          </div>
          <button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-orange text-white transition-all hover:bg-orange/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
