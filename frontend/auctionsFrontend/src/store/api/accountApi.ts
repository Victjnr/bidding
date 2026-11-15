import { baseApi } from './baseApi';
import type { AddressResource, SecuritySession, LoginHistoryEntry, UserProfileUpdate } from '@/types/account';
import type { AuctionResource } from '@/types/auction';

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

export const accountApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Addresses
    getAddresses: builder.query<AddressResource[], void>({
      query: () => '/account/addresses',
      transformResponse: (response: any) => (Array.isArray(response) ? response : response?.data ?? []),
      providesTags: ['Address'],
    }),
    addAddress: builder.mutation<AddressResource, Omit<AddressResource, 'id' | 'uuid' | 'createdAt'>>({
      query: (body) => ({ url: '/account/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    updateAddress: builder.mutation<AddressResource, { uuid: string; data: Partial<AddressResource> }>({
      query: ({ uuid, data }) => ({ url: `/account/addresses/${uuid}`, method: 'PUT', body: data }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/account/addresses/${uuid}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),
    setDefaultAddress: builder.mutation<void, { uuid: string; type: 'billing' | 'shipping' }>({
      query: ({ uuid, type }) => ({ url: `/account/addresses/${uuid}/default`, method: 'POST', body: { type } }),
      invalidatesTags: ['Address'],
    }),

    // Profile & Account Actions
    updateProfile: builder.mutation<void, UserProfileUpdate>({
      query: (body) => ({ url: '/account/profile', method: 'PUT', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    uploadAvatar: builder.mutation<{ avatarPath: string }, FormData>({
      query: (body) => ({ url: '/account/avatar', method: 'POST', body }),
      invalidatesTags: ['CurrentUser'],
    }),
    closeAccount: builder.mutation<void, { confirmation: string }>({
      query: (body) => ({ url: '/account/close', method: 'POST', body }),
      invalidatesTags: ['CurrentUser', 'Auth'],
    }),

    // Security & Sessions
    changePassword: builder.mutation<void, Record<string, string>>({
      query: (body) => ({ url: '/account/security/password', method: 'POST', body }),
    }),
    getSessions: builder.query<SecuritySession[], void>({
      query: () => '/account/security/sessions',
      transformResponse: (response: any) => (Array.isArray(response) ? response : response?.data ?? []),
      providesTags: ['Session'],
    }),
    revokeSession: builder.mutation<void, string>({
      query: (id) => ({ url: `/account/security/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Session'],
    }),
    getLoginHistory: builder.query<LoginHistoryEntry[], void>({
      query: () => '/account/security/login-history',
      transformResponse: (response: any) => (Array.isArray(response) ? response : response?.data ?? []),
    }),

    // Bids & Watchlist
    getMyBids: builder.query<PaginatedResponse<AuctionResource & { bidStatus: 'highest' | 'outbid' | 'won' | 'lost'; myMaxBid: number }>, { status: 'active' | 'won' | 'lost' | 'all'; page?: number }>({
      query: (params) => ({ url: '/account/bids', params }),
    }),
    getWatchlist: builder.query<PaginatedResponse<AuctionResource & { notifyEndingSoon: boolean; notifyOutbid: boolean }>, { page?: number }>({
      query: (params) => ({ url: '/account/watchlist', params }),
      providesTags: ['Watchlist'],
    }),
    updateWatchlistPreferences: builder.mutation<void, { auctionUuid: string; preferences: { notifyEndingSoon: boolean; notifyOutbid: boolean } }>({
      query: ({ auctionUuid, preferences }) => ({ url: `/account/watchlist/${auctionUuid}/preferences`, method: 'PUT', body: preferences }),
      invalidatesTags: ['Watchlist'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  useUpdateProfileMutation,
  useUploadAvatarMutation,
  useCloseAccountMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useRevokeSessionMutation,
  useGetLoginHistoryQuery,
  useGetMyBidsQuery,
  useGetWatchlistQuery,
  useUpdateWatchlistPreferencesMutation,
} = accountApi;
