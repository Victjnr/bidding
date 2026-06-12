import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '@/types';

/* ═══════════════════════════════════════════════════
   Notifications Slice
   ═══════════════════════════════════════════════════ */

interface NotificationsState {
  items: AppNotification[];
  unreadCount: number;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
};

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    setNotifications(state, action: PayloadAction<AppNotification[]>) {
      state.items = action.payload;
      state.unreadCount = action.payload.filter((n) => !n.read_at).length;
    },
    addNotification(state, action: PayloadAction<AppNotification>) {
      state.items.unshift(action.payload);
      if (!action.payload.read_at) {
        state.unreadCount += 1;
      }
    },
    markAsRead(state, action: PayloadAction<string>) {
      const notification = state.items.find((n) => n.id === action.payload);
      if (notification && !notification.read_at) {
        notification.read_at = new Date().toISOString();
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    markAllAsRead(state) {
      const now = new Date().toISOString();
      state.items.forEach((n) => {
        if (!n.read_at) {
          n.read_at = now;
        }
      });
      state.unreadCount = 0;
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
} = notificationsSlice.actions;

/* Selectors */
export const selectNotifications = (state: { notifications: NotificationsState }) =>
  state.notifications.items;
export const selectUnreadCount = (state: { notifications: NotificationsState }) =>
  state.notifications.unreadCount;

export default notificationsSlice.reducer;
