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
    const stateToken = (getState() as { auth: { accessToken: string | null } }).auth.accessToken;
    const token = stateToken || localStorage.getItem('access_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Accept', 'application/json');
    return headers;
  },
});

function normalizeEnvelope(result: any) {
  if (
    result?.data &&
    typeof result.data === 'object' &&
    !Array.isArray(result.data) &&
    result.data.status === 'success' &&
    'data' in result.data
  ) {
    const meta = result.data.meta;
    const hasPagination =
      meta &&
      typeof meta === 'object' &&
      !Array.isArray(meta) &&
      ('currentPage' in meta || 'current_page' in meta || 'total' in meta);

    if (hasPagination) {
      result.data = {
        data: result.data.data,
        meta: {
          currentPage: meta.currentPage ?? meta.current_page ?? 1,
          lastPage: meta.lastPage ?? meta.last_page ?? 1,
          perPage: meta.perPage ?? meta.per_page ?? 20,
          total: meta.total ?? 0,
          current_page: meta.current_page ?? meta.currentPage ?? 1,
          last_page: meta.last_page ?? meta.lastPage ?? 1,
          per_page: meta.per_page ?? meta.perPage ?? 20,
        },
      };
    } else {
      result.data = result.data.data;
    }
  }
  return result;
}

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const reqUrl = typeof args === 'string' ? args : args.url;
    if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/register') || reqUrl.includes('/auth/refresh')) {
      return result;
    }

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

    const refreshPayload = (refreshResult.data as any)?.data ?? refreshResult.data;
    const newAccessToken = refreshPayload?.access_token ?? refreshPayload?.accessToken;

    if (newAccessToken) {
      if (refreshPayload?.refresh_token) {
        localStorage.setItem('refresh_token', refreshPayload.refresh_token);
      }
      api.dispatch(setAccessToken(newAccessToken));

      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      localStorage.removeItem('refresh_token');
      api.dispatch(clearCredentials());
      api.dispatch({ type: 'api/resetApiState' });
    }
  }

  return normalizeEnvelope(result);
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
