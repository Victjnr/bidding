export interface SellerStats {
  activeListings: number;
  activeListingsTrend: number;
  bidsToday: number;
  bidsTodayTrend: number;
  gmvMonth: number;
  gmvMonthTrend: number;
  pendingPayouts: number;
  pendingPayoutsTrend: number;
}

export interface RevenueDataPoint {
  date: string; // ISO date string or formatted label
  gmv: number;
  commission: number;
}

export interface ListingPerformance {
  uuid: string;
  title: string;
  views: number;
  watchlistAdds: number;
  uniqueBidders: number;
  bidVelocity: number; // bids per hour
  finalPrice: number | null;
  sellThroughRate: number; // percentage
}

export interface BuyerGeography {
  country: string;
  code: string; // ISO 3166-1 alpha-2 (e.g., 'ZW', 'ZA', 'US')
  count: number;
}

export interface SellerAnalytics {
  performance: ListingPerformance[];
  topCategories: { name: string; value: number }[];
  geography: BuyerGeography[];
}

export interface ReviewResource {
  id: number;
  uuid: string;
  rating: number;
  comment: string;
  authorAlias: string;
  createdAt: string;
}

export interface SellerProfile {
  uuid: string;
  displayName: string;
  avatarPath: string | null;
  memberSince: string;
  rating: number;
  totalSales: number;
  verifications: {
    email: boolean;
    identity: boolean;
    biometric: boolean;
  };
}
