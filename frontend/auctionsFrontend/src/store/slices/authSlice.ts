import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@/types/auth';

/* ═══════════════════════════════════════════════════
   Auth Slice — manages memory-only JWT token + user
   ═══════════════════════════════════════════════════ */

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function loadStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const storedToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
const storedUser = typeof window !== 'undefined' ? loadStoredUser() : null;

const initialState: AuthState = {
  user: storedUser,
  accessToken: storedToken,
  isAuthenticated: Boolean(storedToken && storedUser),
  isLoading: Boolean(storedToken),
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(
      state,
      action: PayloadAction<{ user: AuthUser; accessToken: string; refreshToken?: string }>,
    ) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      try {
        localStorage.setItem('access_token', action.payload.accessToken);
        localStorage.setItem('auth_user', JSON.stringify(action.payload.user));
        if (action.payload.refreshToken) {
          localStorage.setItem('refresh_token', action.payload.refreshToken);
        }
      } catch {
        // Ignore storage quota errors
      }
    },

    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      try {
        localStorage.setItem('auth_user', JSON.stringify(action.payload));
      } catch {
        // Ignore storage errors
      }
    },

    setAccessToken(state, action: PayloadAction<string>) {
      state.accessToken = action.payload;
      state.isAuthenticated = true;
      try {
        localStorage.setItem('access_token', action.payload);
      } catch {
        // Ignore storage errors
      }
    },

    clearCredentials(state) {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('auth_user');
      } catch {
        // Ignore storage errors
      }
    },

    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setCredentials,
  setUser,
  setAccessToken,
  clearCredentials,
  setLoading,
} = authSlice.actions;

/* Selectors */
export const selectCurrentUser = (state: { auth: AuthState }) =>
  state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth.isAuthenticated;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth.accessToken;
export const selectAuthLoading = (state: { auth: AuthState }) =>
  state.auth.isLoading;

export default authSlice.reducer;
