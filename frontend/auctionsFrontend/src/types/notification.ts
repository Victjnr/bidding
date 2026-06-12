export interface NotificationResource {
  id: number;
  uuid: string;
  type: 'bid' | 'won' | 'payment' | 'dispute' | 'system';
  channel: 'in_app' | 'email' | 'push' | 'sms';
  title: string;
  body: string;
  data: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  emailOutbid: boolean;
  pushOutbid: boolean;
  smsOutbid: boolean;
  emailEndingSoon: boolean;
  pushEndingSoon: boolean;
  emailWon: boolean;
  pushWon: boolean;
  emailPaymentDue: boolean;
  emailMarketing: boolean;
}

export interface ConversationResource {
  id: number;
  uuid: string;
  auctionId: string;
  auctionTitle: string;
  buyerId: string;
  buyerAlias: string;
  sellerId: string;
  sellerAlias: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMessagePreview?: string;
}

export interface MessageResource {
  id: number;
  uuid: string;
  conversationId: string;
  senderId: string;
  body: string;
  isFlagged: boolean;
  readAt: string | null;
  createdAt: string;
}
