import { baseApi } from './baseApi';
import type { AppNotification, NotificationPreferences } from '@/types';
import type { PaginatedResponse } from '@/types/auction';

export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<PaginatedResponse<AppNotification>, { page?: number; filter?: string }>({
      query: ({ page = 1, filter }) => ({
        url: '/notifications',
        params: { page, filter: filter !== 'all' ? filter : undefined },
      }),
      providesTags: ['Notification'],
    }),

    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    markAllNotificationsRead: builder.mutation<void, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: ['Notification'],
    }),

    getNotificationPreferences: builder.query<NotificationPreferences, void>({
      query: () => '/notifications/preferences',
    }),

    updateNotificationPreferences: builder.mutation<NotificationPreferences, Partial<NotificationPreferences>>({
      query: (body) => ({
        url: '/notifications/preferences',
        method: 'PUT',
        body,
      }),
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
} = notificationApi;
