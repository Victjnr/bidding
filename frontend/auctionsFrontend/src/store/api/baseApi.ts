import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { clearCredentials, setAccessToken } from '@/store/slices/authSlice';

/* ═══════════════════════════════════════════════════
   RTK Query Base API
   ─────────────────────────────────────────────────
   - Attaches JWT Bearer token to every request
   - Automatically refreshes token on 401
   - Retries the original request with the new token
   ═══════════════════════════════════════════════════ */

const API_BASE_URL =
  (import.meta.env['VITE_API_BASE_URL'] as string | undefined) ??
  'http://localhost:8000/api/v1';


const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      api.dispatch(clearCredentials());
      return result;
    }

    // Attempt token refresh
    const refreshResult = await baseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
        body: { refresh_token: refreshToken },
      },
      api,
      extraOptions,
    );

    if (refreshResult.data) {
      const { access_token } = refreshResult.data as { access_token: string };
      api.dispatch(setAccessToken(access_token));

      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem('refresh_token');
      api.dispatch(clearCredentials());
      api.dispatch({ type: 'api/resetApiState' });
      // Removed window.location.href redirect to prevent infinite reload loops.
      // React Router ProtectedRoute components will handle redirects.
    }
  }

  return result;
};

/**
 * The single RTK Query API instance.
 * Feature-specific endpoints are injected via `baseApi.injectEndpoints()`
 * in their respective `src/store/api/<feature>Api.ts` files.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'Auction',
    'AuctionList',
    'Bid',
    'User',
    'Profile',
    'Notification',
    'Conversation',
    'Message',
    'Payment',
    'Wallet',
    'Payout',
    'Watchlist',
    'Category',
    'AdminStats',
    'Auth',
    'CurrentUser',
    'PaymentMethod',
    'Dispute',
    'SavedSearch',
    'Review',
    'Profile',
    'AdminUser',
    'AdminAuction',
    'KycQueue',
    'AdminSettings',
    'FeatureFlag',
    'AuditLog',
    'Address',
    'Session',
  ],
  endpoints: () => ({}),
});

export default baseApi;
