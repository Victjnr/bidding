import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/store/api/baseApi';
import authReducer from '@/store/slices/authSlice';
import uiReducer from '@/store/slices/uiSlice';
import notificationsReducer from '@/store/slices/notificationsSlice';

/* ═══════════════════════════════════════════════════
   Redux Store
   ═══════════════════════════════════════════════════ */

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    ui: uiReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
  devTools: import.meta.env.DEV,
});

/* Typed hooks helpers */
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
