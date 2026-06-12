import { baseApi } from './baseApi';
import type { SellerStats, RevenueDataPoint, SellerAnalytics, SellerProfile, ReviewResource } from '@/types/seller';
import type { PaginatedResponse, AuctionResource } from '@/types/auction';

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSellerDashboardStats: builder.query<SellerStats, void>({
      query: () => '/seller/stats',
      providesTags: ['AdminStats'], // Reusing AdminStats tag or could create a specific one
    }),

    getSellerRevenueChart: builder.query<RevenueDataPoint[], { range: '7D' | '30D' | '90D' | 'custom' }>({
      query: (params) => ({
        url: '/seller/revenue',
        params,
      }),
    }),

    getSellerListings: builder.query<PaginatedResponse<AuctionResource>, { page?: number; status?: string }>({
      query: ({ page = 1, status }) => ({
        url: '/seller/auctions',
        params: { page, status },
      }),
      providesTags: ['AuctionList'],
    }),

    bulkUpdateListings: builder.mutation<void, { uuids: string[]; action: 'cancel' | 'relist' }>({
      query: (body) => ({
        url: '/seller/auctions/bulk',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AuctionList', 'Auction'],
    }),

    getSellerAnalytics: builder.query<SellerAnalytics, void>({
      query: () => '/seller/analytics',
    }),

    getSellerProfile: builder.query<{ profile: SellerProfile; reviews: ReviewResource[] }, string>({
      query: (sellerUuid) => `/sellers/${sellerUuid}`,
      providesTags: (result, error, id) => [{ type: 'Profile', id }],
    }),
  }),
});

export const {
  useGetSellerDashboardStatsQuery,
  useGetSellerRevenueChartQuery,
  useGetSellerListingsQuery,
  useBulkUpdateListingsMutation,
  useGetSellerAnalyticsQuery,
  useGetSellerProfileQuery,
} = sellerApi;
