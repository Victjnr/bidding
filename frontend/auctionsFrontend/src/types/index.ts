/* ═══════════════════════════════════════════════════
   Upload Auctions Domain Types
   ═══════════════════════════════════════════════════ */

// ─── User & Auth ───────────────────────────────────

import type { AuthUser } from './auth';
import type { AuctionResource, AuctionStatus } from './auction';

export * from './auth';
export * from './auction';
export * from './bid';
export * from './payment';
export * from './notification';
export * from './search';
export * from './seller';
export * from './admin';
export type {
  AddressResource,
  SecuritySession,
  UserProfileUpdate,
} from './account';



export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  parent_id: string | null;
  children?: Category[];
  auction_count: number;
}

// ─── Bidding ───────────────────────────────────────

export type BidType = 'manual' | 'proxy' | 'auto';

export type BidStatus = 'active' | 'outbid' | 'winning' | 'won' | 'cancelled';

export interface Bid {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder: Pick<AuthUser, 'id' | 'displayName' | 'avatarPath'>;
  amount: number;
  max_amount: number | null;
  type: BidType;
  status: BidStatus;
  is_leading: boolean;
  created_at: string;
}

export interface PlaceBidPayload {
  auction_id: string;
  amount: number;
  max_amount?: number;
  type: BidType;
}

// ─── Payments ──────────────────────────────────────

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Payment {
  id: string;
  auction_id: string;
  payer_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WalletBalance {
  available: number;
  pending: number;
  currency: string;
}

export interface Payout {
  id: string;
  seller_id: string;
  amount: number;
  currency: string;
  status: PayoutStatus;
  destination: string;
  created_at: string;
}

// ─── Notifications ─────────────────────────────────

export type NotificationType =
  | 'bid_placed'
  | 'bid_outbid'
  | 'outbid'
  | 'auction_won'
  | 'auction_ended'
  | 'auction_ending_soon'
  | 'auction_started'
  | 'payment_received'
  | 'payment_failed'
  | 'dispute_opened'
  | 'dispute_resolved'
  | 'kyc_approved'
  | 'kyc_rejected'
  | 'message_received'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

// ─── Messaging ─────────────────────────────────────

export interface Conversation {
  id: string;
  auction_id: string | null;
  participants: Pick<AuthUser, 'id' | 'displayName' | 'avatarPath'>[];
  last_message: Message | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: Pick<AuthUser, 'id' | 'displayName' | 'avatarPath'>;
  body: string;
  attachments: MessageAttachment[];
  read_at: string | null;
  created_at: string;
}

export interface MessageAttachment {
  id: string;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
}


// ─── Watchlist ─────────────────────────────────────

export interface WatchlistItem {
  id: string;
  auction_id: string;
  auction: AuctionResource;
  created_at: string;
}

// ─── WebSocket Events ──────────────────────────────

export interface AuctionEndedEvent {
  auction_id: string;
  winner_id: string | null;
  final_price: number;
  status: AuctionStatus;
}
