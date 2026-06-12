import { baseApi } from './baseApi';
import type { AuctionResource, AuctionFilters, PaginatedResponse } from '@/types/auction';
import type { BidResource, ProxyBidResource } from '@/types/bid';

export const auctionApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAuctions: builder.query<PaginatedResponse<AuctionResource>, AuctionFilters>({
      query: (params) => ({
        url: '/auctions',
        method: 'GET',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map(({ uuid }) => ({ type: 'Auction' as const, id: uuid })),
              { type: 'Auction', id: 'LIST' },
            ]
          : [{ type: 'Auction', id: 'LIST' }],
    }),

    getAuction: builder.query<AuctionResource, string>({
      query: (uuid) => `/auctions/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: 'Auction', id: uuid }],
    }),

    getCategories: builder.query<{ data: any[] }, void>({
      query: () => '/categories',
    }),

    getLandingStats: builder.query<{ data: { active_auctions: number, registered_bidders: number, bids_today: number } }, void>({
      query: () => '/stats/landing',
    }),

    createAuction: builder.mutation<AuctionResource, Partial<AuctionResource>>({
      query: (payload) => ({
        url: '/auctions',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [{ type: 'Auction', id: 'LIST' }],
    }),

    updateAuction: builder.mutation<AuctionResource, { uuid: string; payload: Partial<AuctionResource> }>({
      query: ({ uuid, payload }) => ({
        url: `/auctions/${uuid}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: (result, error, { uuid }) => [
        { type: 'Auction', id: uuid },
        { type: 'Auction', id: 'LIST' },
      ],
    }),

    uploadMedia: builder.mutation<void, { uuid: string; files: FormData }>({
      query: ({ uuid, files }) => ({
        url: `/auctions/${uuid}/media`,
        method: 'POST',
        body: files,
      }),
      invalidatesTags: (result, error, { uuid }) => [{ type: 'Auction', id: uuid }],
    }),

    deleteMedia: builder.mutation<void, { auctionUuid: string; mediaId: string }>({
      query: ({ auctionUuid, mediaId }) => ({
        url: `/auctions/${auctionUuid}/media/${mediaId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { auctionUuid }) => [{ type: 'Auction', id: auctionUuid }],
    }),

    submitForReview: builder.mutation<void, string>({
      query: (uuid) => ({
        url: `/auctions/${uuid}/submit`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, uuid) => [{ type: 'Auction', id: uuid }, { type: 'Auction', id: 'LIST' }],
    }),

    // ─── Bidding ─────────────────────────────────────
    
    getBids: builder.query<BidResource[], string>({
      query: (auctionUuid) => `/auctions/${auctionUuid}/bids`,
      providesTags: (result, error, uuid) => [{ type: 'Bid', id: `AuctionList-${uuid}` }],
    }),
    
    placeBid: builder.mutation<BidResource, { auctionUuid: string; amount: number }>({
      query: ({ auctionUuid, amount }) => ({
        url: `/auctions/${auctionUuid}/bids`,
        method: 'POST',
        body: { amount },
      }),
      invalidatesTags: (result, error, { auctionUuid }) => [{ type: 'Bid', id: `AuctionList-${auctionUuid}` }],
    }),
    
    placeProxyBid: builder.mutation<ProxyBidResource, { auctionUuid: string; maxAmount: number }>({
      query: ({ auctionUuid, maxAmount }) => ({
        url: `/auctions/${auctionUuid}/proxy-bids`,
        method: 'POST',
        body: { maxAmount },
      }),
    }),
    
    getProxyBid: builder.query<ProxyBidResource | null, string>({
      query: (auctionUuid) => `/auctions/${auctionUuid}/proxy-bids/current`,
    }),
    
    cancelProxyBid: builder.mutation<void, string>({
      query: (auctionUuid) => ({
        url: `/auctions/${auctionUuid}/proxy-bids/current`,
        method: 'DELETE',
      }),
    }),
  }),
});

export const {
  useListAuctionsQuery,
  useGetAuctionQuery,
  useGetCategoriesQuery,
  useGetLandingStatsQuery,
  useCreateAuctionMutation,
  useUpdateAuctionMutation,
  useUploadMediaMutation,
  useDeleteMediaMutation,
  useSubmitForReviewMutation,
  useGetBidsQuery,
  usePlaceBidMutation,
  usePlaceProxyBidMutation,
  useGetProxyBidQuery,
  useCancelProxyBidMutation,
} = auctionApi;

// Note: RTK Query does not natively have an infinite scroll hook out of the box like React Query.
// We will build `useInfiniteAuctionListQuery` as a custom wrapper or use a paginated list with concatenation in the component.
