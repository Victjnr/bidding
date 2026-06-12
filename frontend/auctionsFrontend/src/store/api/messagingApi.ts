import { baseApi } from './baseApi';
import type { Conversation, Message } from '@/types';
import type { PaginatedResponse } from '@/types/auction';

export const messagingApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getConversations: builder.query<Conversation[], void>({
      query: () => '/conversations',
      providesTags: ['Conversation'],
    }),

    getMessages: builder.query<PaginatedResponse<Message>, { conversationId: string; page?: number }>({
      query: ({ conversationId, page = 1 }) => ({
        url: `/conversations/${conversationId}/messages`,
        params: { page },
      }),
      providesTags: (result, error, { conversationId }) => [{ type: 'Message', id: conversationId }],
    }),

    sendMessage: builder.mutation<Message, { conversationId: string; body: string }>({
      query: ({ conversationId, body }) => ({
        url: `/conversations/${conversationId}/messages`,
        method: 'POST',
        body: { body },
      }),
      invalidatesTags: (result, error, { conversationId }) => [
        { type: 'Message', id: conversationId },
        'Conversation',
      ],
    }),

    markConversationRead: builder.mutation<void, string>({
      query: (conversationId) => ({
        url: `/conversations/${conversationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Conversation'],
    }),
  }),
});

export const {
  useGetConversationsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkConversationReadMutation,
} = messagingApi;
