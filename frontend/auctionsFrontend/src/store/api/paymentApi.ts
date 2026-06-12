import { baseApi } from './baseApi';
import type { PaginatedResponse } from '@/types/auction';
import type {
  PaymentMethodResource,
  TransactionResource,
  WalletEntry,
  DisputeResource,
  PaynowInitPayload,
  PaynowInitResponse,
  PaynowStatusResponse
} from '@/types/payment';

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // ─── Payment Methods ───
    listPaymentMethods: builder.query<PaymentMethodResource[], void>({
      query: () => '/payments/methods',
      providesTags: ['PaymentMethod'],
    }),

    attachPaymentMethod: builder.mutation<PaymentMethodResource, Partial<PaymentMethodResource>>({
      query: (body) => ({
        url: '/payments/methods',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['PaymentMethod'],
    }),

    deletePaymentMethod: builder.mutation<void, number>({
      query: (id) => ({
        url: `/payments/methods/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['PaymentMethod'],
    }),

    // ─── Paynow Checkout ───
    initiatePayment: builder.mutation<PaynowInitResponse, PaynowInitPayload>({
      query: (body) => ({
        url: `/payments/initiate`,
        method: 'POST',
        body,
      }),
    }),

    checkPaymentStatus: builder.query<PaynowStatusResponse, string>({
      query: (pollUrl) => ({
        url: `/payments/status`,
        method: 'POST',
        body: { pollUrl }, // Pass the poll URL to backend to check status securely
      }),
    }),

    // ─── Wallet & Ledger ───
    getWalletBalance: builder.query<{ available: number; onHold: number; totalEarned: number }, void>({
      query: () => '/wallet/balance',
      providesTags: ['Wallet'],
    }),

    getWalletLedger: builder.query<PaginatedResponse<WalletEntry>, number>({
      query: (page = 1) => `/wallet/ledger?page=${page}`,
      providesTags: ['Wallet'],
    }),

    getPayouts: builder.query<PaginatedResponse<TransactionResource>, number>({
      query: (page = 1) => `/wallet/payouts?page=${page}`,
      providesTags: ['Wallet'],
    }),

    requestPayout: builder.mutation<TransactionResource, { amount: number; methodId: number }>({
      query: (body) => ({
        url: '/wallet/payouts/request',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Wallet'],
    }),

    // ─── Disputes ───
    openDispute: builder.mutation<DisputeResource, { transactionUuid: string; reason: string; description: string }>({
      query: (body) => ({
        url: `/disputes`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Dispute'],
    }),

    uploadDisputeEvidence: builder.mutation<void, { disputeUuid: string; files: FormData }>({
      query: ({ disputeUuid, files }) => ({
        url: `/disputes/${disputeUuid}/evidence`,
        method: 'POST',
        body: files,
      }),
      invalidatesTags: ['Dispute'],
    }),

    getDispute: builder.query<DisputeResource, string>({
      query: (uuid) => `/disputes/${uuid}`,
      providesTags: (result, error, uuid) => [{ type: 'Dispute', id: uuid }],
    }),
  }),
});

export const {
  useListPaymentMethodsQuery,
  useAttachPaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useInitiatePaymentMutation,
  useCheckPaymentStatusQuery,
  useGetWalletBalanceQuery,
  useGetWalletLedgerQuery,
  useGetPayoutsQuery,
  useRequestPayoutMutation,
  useOpenDisputeMutation,
  useUploadDisputeEvidenceMutation,
  useGetDisputeQuery,
} = paymentApi;
