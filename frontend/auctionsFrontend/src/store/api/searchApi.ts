import { baseApi } from './baseApi';
import type { SearchSuggestion, SavedSearchResource, SearchFacetsResponse } from '@/types/search';
import type { PaginatedResponse } from '@/types/auction';

export const searchApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSearchSuggestions: builder.query<SearchSuggestion[], string>({
      query: (q) => ({
        url: '/search/suggestions',
        params: { q },
      }),
      keepUnusedDataFor: 60, // Cache suggestions slightly longer
    }),

    getSearchFacets: builder.query<SearchFacetsResponse, Record<string, any>>({
      query: (params) => ({
        url: '/search/facets',
        params,
      }),
    }),

    getSavedSearches: builder.query<PaginatedResponse<SavedSearchResource>, { page?: number }>({
      query: ({ page = 1 }) => ({
        url: '/search/saved',
        params: { page },
      }),
      providesTags: ['SavedSearch'],
    }),

    createSavedSearch: builder.mutation<SavedSearchResource, { name: string; filters: Record<string, any> }>({
      query: (body) => ({
        url: '/search/saved',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['SavedSearch'],
    }),

    deleteSavedSearch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/search/saved/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavedSearch'],
    }),
  }),
});

export const {
  useGetSearchSuggestionsQuery,
  useGetSearchFacetsQuery,
  useGetSavedSearchesQuery,
  useCreateSavedSearchMutation,
  useDeleteSavedSearchMutation,
} = searchApi;
