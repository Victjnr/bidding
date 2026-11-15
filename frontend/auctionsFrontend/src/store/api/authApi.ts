import { baseApi } from './baseApi';
import type {
  AuthUser,
  LoginCredentials,
  RegisterPayload,
} from '@/types/auth';
import { setCredentials, clearCredentials } from '../slices/authSlice';

interface LoginResponse {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  requires_2fa?: boolean;
  user_id?: number | string;
}

const unwrapData = (response: any) =>
  response && typeof response === 'object' && 'data' in response && response.status === 'success'
    ? response.data
    : response;

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: unwrapData,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: payload } = await queryFulfilled;
          if (!payload.requires_2fa && payload.access_token) {
            dispatch(
              setCredentials({
                user: payload.user,
                accessToken: payload.access_token,
                refreshToken: payload.refresh_token,
              }),
            );
          }
        } catch {
          // Handled in component
        }
      },
    }),

    register: builder.mutation<{ user: AuthUser; access_token: string; refresh_token?: string }, RegisterPayload>({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload,
      }),
      transformResponse: unwrapData,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: payload } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: payload.user,
              accessToken: payload.access_token,
              refreshToken: payload.refresh_token,
            }),
          );
        } catch {
          // Handled in component
        }
      },
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(clearCredentials());
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),

    refreshToken: builder.mutation<{ access_token: string; refresh_token?: string }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    verifyEmail: builder.mutation<void, { token: string }>({
      query: (body) => ({
        url: '/auth/email/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    resendEmailVerification: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/email/resend',
        method: 'POST',
      }),
    }),

    verifyPhone: builder.mutation<void, { otp: string }>({
      query: (body) => ({
        url: '/auth/phone/verify',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    enable2FA: builder.mutation<{ qrCodeUrl: string; qr_code_url?: string; secret: string }, void>({
      query: () => ({
        url: '/auth/2fa/enable',
        method: 'POST',
      }),
      transformResponse: unwrapData,
    }),

    confirm2FA: builder.mutation<void, { code: string }>({
      query: (body) => ({
        url: '/auth/2fa/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    verify2FA: builder.mutation<LoginResponse, { code: string; email?: string; user_id?: number | string }>({
      query: (body) => ({
        url: '/auth/2fa/verify',
        method: 'POST',
        body,
      }),
      transformResponse: unwrapData,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: payload } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: payload.user,
              accessToken: payload.access_token,
              refreshToken: payload.refresh_token,
            }),
          );
        } catch {
          // Handled in component
        }
      },
    }),

    disable2FA: builder.mutation<void, { code: string }>({
      query: (body) => ({
        url: '/auth/2fa/disable',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    uploadKycDocument: builder.mutation<void, FormData>({
      query: (formData) => ({
        url: '/auth/kyc/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    getKycStatus: builder.query<{ status: string; currentTier: number; nextTierRequirement: string }, void>({
      query: () => '/auth/kyc/status',
      transformResponse: unwrapData,
      providesTags: ['CurrentUser'],
    }),

    getCurrentUser: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['CurrentUser'],
      transformResponse: unwrapData,
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data: payload } = await queryFulfilled;
          dispatch({ type: 'auth/setUser', payload });
        } catch {
          dispatch(clearCredentials());
        }
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useVerifyEmailMutation,
  useResendEmailVerificationMutation,
  useVerifyPhoneMutation,
  useEnable2FAMutation,
  useConfirm2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useUploadKycDocumentMutation,
  useGetKycStatusQuery,
  useGetCurrentUserQuery,
} = authApi;
