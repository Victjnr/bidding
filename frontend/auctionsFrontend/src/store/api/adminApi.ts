import { baseApi } from './baseApi';
import type {
  AdminDashboardStats,
  RevenueChartPoint,
  RegistrationChartPoint,
  BidVelocityPoint,
  AdminUserResource,
  UserDetail,
  KycDocument,
  PendingAuction,
  SystemSetting,
  FeatureFlag,
  AuditLogEntry,
} from '@/types/admin';

interface PaginatedResponse<T> {
  data: T[];
  meta: { currentPage: number; lastPage: number; perPage: number; total: number };
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* ─── Dashboard ─── */
    getAdminDashboardStats: builder.query<AdminDashboardStats, void>({
      query: () => '/admin/stats',
      providesTags: ['AdminStats'],
    }),

    getAdminRevenueChart: builder.query<RevenueChartPoint[], void>({
      query: () => '/admin/revenue-chart',
    }),

    getAdminRegistrations: builder.query<RegistrationChartPoint[], void>({
      query: () => '/admin/registrations-chart',
    }),

    getAdminBidVelocity: builder.query<BidVelocityPoint[], void>({
      query: () => '/admin/bid-velocity',
    }),

    /* ─── Users ─── */
    getAdminUsers: builder.query<PaginatedResponse<AdminUserResource>, { page?: number; search?: string; status?: string; kycTier?: string; role?: string }>({
      query: (params) => ({ url: '/admin/users', params }),
      providesTags: ['AdminUser'],
    }),

    getAdminUserDetail: builder.query<UserDetail, string>({
      query: (uuid) => `/admin/users/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: 'AdminUser', id: uuid }],
    }),

    suspendUser: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/admin/users/${uuid}/suspend`, method: 'POST' }),
      invalidatesTags: ['AdminUser', 'AuditLog'],
    }),

    banUser: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/admin/users/${uuid}/ban`, method: 'POST' }),
      invalidatesTags: ['AdminUser', 'AuditLog'],
    }),

    activateUser: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/admin/users/${uuid}/activate`, method: 'POST' }),
      invalidatesTags: ['AdminUser', 'AuditLog'],
    }),

    /* ─── KYC ─── */
    getKycQueue: builder.query<PaginatedResponse<KycDocument>, { page?: number }>({
      query: (params) => ({ url: '/admin/kyc', params }),
      providesTags: ['KycQueue'],
    }),

    approveKyc: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/admin/kyc/${uuid}/approve`, method: 'POST' }),
      invalidatesTags: ['KycQueue', 'AdminUser'],
    }),

    rejectKyc: builder.mutation<void, { uuid: string; reason: string }>({
      query: ({ uuid, reason }) => ({ url: `/admin/kyc/${uuid}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: ['KycQueue', 'AdminUser'],
    }),

    /* ─── Auction Moderation ─── */
    getPendingAuctions: builder.query<PaginatedResponse<PendingAuction>, { page?: number; status?: string }>({
      query: (params) => ({ url: '/admin/auctions', params }),
      providesTags: ['AdminAuction'],
    }),

    approveAuction: builder.mutation<void, string>({
      query: (uuid) => ({ url: `/admin/auctions/${uuid}/approve`, method: 'POST' }),
      invalidatesTags: ['AdminAuction', 'AuctionList'],
    }),

    rejectAuction: builder.mutation<void, { uuid: string; reason: string }>({
      query: ({ uuid, reason }) => ({ url: `/admin/auctions/${uuid}/reject`, method: 'POST', body: { reason } }),
      invalidatesTags: ['AdminAuction'],
    }),

    requestAuctionChanges: builder.mutation<void, { uuid: string; notes: string }>({
      query: ({ uuid, notes }) => ({ url: `/admin/auctions/${uuid}/request-changes`, method: 'POST', body: { notes } }),
      invalidatesTags: ['AdminAuction'],
    }),

    /* ─── Settings ─── */
    getSettings: builder.query<SystemSetting[], void>({
      query: () => '/admin/settings',
      providesTags: ['AdminSettings'],
    }),

    updateSettingsGroup: builder.mutation<void, { group: string; settings: Record<string, unknown> }>({
      query: (body) => ({ url: '/admin/settings', method: 'PUT', body }),
      invalidatesTags: ['AdminSettings'],
    }),

    getFeatureFlags: builder.query<FeatureFlag[], void>({
      query: () => '/admin/feature-flags',
      providesTags: ['FeatureFlag'],
    }),

    updateFeatureFlag: builder.mutation<void, { id: string; enabled: boolean; rolloutPercentage: number; allowedRoles: string[] }>({
      query: ({ id, ...body }) => ({ url: `/admin/feature-flags/${id}`, method: 'PUT', body }),
      invalidatesTags: ['FeatureFlag'],
    }),

    /* ─── Audit Log ─── */
    getAuditLogs: builder.query<PaginatedResponse<AuditLogEntry>, { page?: number; search?: string; action?: string }>({
      query: (params) => ({ url: '/admin/audit-logs', params }),
      providesTags: ['AuditLog'],
    }),
  }),
});

export const {
  useGetAdminDashboardStatsQuery,
  useGetAdminRevenueChartQuery,
  useGetAdminRegistrationsQuery,
  useGetAdminBidVelocityQuery,
  useGetAdminUsersQuery,
  useGetAdminUserDetailQuery,
  useSuspendUserMutation,
  useBanUserMutation,
  useActivateUserMutation,
  useGetKycQueueQuery,
  useApproveKycMutation,
  useRejectKycMutation,
  useGetPendingAuctionsQuery,
  useApproveAuctionMutation,
  useRejectAuctionMutation,
  useRequestAuctionChangesMutation,
  useGetSettingsQuery,
  useUpdateSettingsGroupMutation,
  useGetFeatureFlagsQuery,
  useUpdateFeatureFlagMutation,
  useGetAuditLogsQuery,
} = adminApi;
