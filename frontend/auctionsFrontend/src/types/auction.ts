import type { AuthUser } from './auth';

export type AuctionType = 'forward' | 'reverse' | 'sealed' | 'penny' | 'bin' | 'live';
export type AuctionStatus = 'draft' | 'pending' | 'scheduled' | 'active' | 'extended' | 'closing' | 'ended' | 'sold' | 'no_sale' | 'cancelled' | 'disputed';

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  parent?: CategoryNode;
  children?: CategoryNode[];
}

export interface AuctionMedia {
  id: string;
  type: 'image' | 'video' | 'document';
  cdnUrl: string;
  isPrimary: boolean;
  sortOrder: number;
}

export type UserMinimal = Pick<AuthUser, 'id' | 'uuid' | 'displayName' | 'avatarPath'> & {
  rating?: number;
  memberSince?: string;
};

export interface AuctionResource {
  id: string;
  uuid: string;
  title: string;
  description: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  currentPrice: number;
  reservePrice?: number;
  isReserveMet: boolean;
  startPrice: number;
  binPrice?: number;
  bidIncrement: number | { type: 'percentage'; value: number };
  totalBids: number;
  startAt: string;
  endAt: string;
  seller: UserMinimal;
  category: CategoryNode;
  media: AuctionMedia[];
  currency: string;
  condition: 'new' | 'used_like_new' | 'used_good' | 'used_fair' | 'refurbished' | 'parts_only';
  location: string;
}

export interface AuctionFilters {
  page?: number;
  limit?: number;
  category?: string;
  type?: AuctionType[];
  minPrice?: number;
  maxPrice?: number;
  condition?: string[];
  endingSoon?: boolean;
  country?: string;
  sortBy?: 'ending_soonest' | 'newest' | 'price_asc' | 'price_desc' | 'bids_desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}
