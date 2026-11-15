export interface BidResource {
  id: number;
  uuid: string;
  auctionId: string;
  amount: number;
  type: 'manual' | 'proxy' | 'bin';
  bidderAlias: string;
  isWinning: boolean;
  createdAt: string;
}

export interface ProxyBidResource {
  id: number;
  maxAmount: number;
  isExhausted: boolean;
  currentBidId: string | null;
  createdAt: string;
}

export interface BidPlacedEvent {
  bidId: string;
  amount: number;
  bidderAlias: string;
  totalBids: number;
  isReserveMet: boolean;
  timeRemainingSeconds: number;
  nextMinimumBid: number;
  currentPrice: number;
}

export interface AuctionExtendedEvent {
  newEndAt: string;
  extensionCount: number;
}

export interface AuctionClosedEvent {
  auctionId?: string;
  winnerId: string | null;
  winnerAlias: string | null;
  finalPrice: number | null;
  isReserveMet: boolean;
}
