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
  requires_2fa?: boolean;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (!data.requires_2fa) {
            dispatch(
              setCredentials({
                user: data.user,
                accessToken: data.access_token,
              }),
            );
          }
        } catch {
          // Handled in component
        }
      },
    }),

    register: builder.mutation<{ user: AuthUser; access_token: string }, RegisterPayload>({
      query: (payload) => ({
        url: '/auth/register',
        method: 'POST',
        body: payload,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.access_token,
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
          // Still clear locally even if network fails
          dispatch(clearCredentials());
        }
      },
    }),

    refreshToken: builder.mutation<{ access_token: string }, void>({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),

    verifyEmail: builder.mutation<void, { token: string }>({
      query: (body) => ({
        url: '/auth/verify-email',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    verifyPhone: builder.mutation<void, { otp: string }>({
      query: (body) => ({
        url: '/auth/verify-phone',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    enable2FA: builder.mutation<{ qrCodeUrl: string; secret: string }, void>({
      query: () => ({
        url: '/auth/2fa/enable',
        method: 'POST',
      }),
    }),

    confirm2FA: builder.mutation<void, { code: string }>({
      query: (body) => ({
        url: '/auth/2fa/confirm',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CurrentUser'],
    }),

    verify2FA: builder.mutation<LoginResponse, { code: string; email: string }>({
      query: (body) => ({
        url: '/auth/2fa/verify',
        method: 'POST',
        body,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            setCredentials({
              user: data.user,
              accessToken: data.access_token,
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
      providesTags: ['CurrentUser'],
    }),
    
    getCurrentUser: builder.query<AuthUser, void>({
      query: () => '/auth/me',
      providesTags: ['CurrentUser'],
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Just updates the user part
          dispatch({ type: 'auth/setUser', payload: data });
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
  useVerifyPhoneMutation,
  useEnable2FAMutation,
  useConfirm2FAMutation,
  useVerify2FAMutation,
  useDisable2FAMutation,
  useUploadKycDocumentMutation,
  useGetKycStatusQuery,
  useGetCurrentUserQuery,
} = authApi;
