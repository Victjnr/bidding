export interface SearchSuggestion {
  id: string;
  type: 'auction' | 'category' | 'recent_search';
  title: string;
  subtitle?: string;
  imageUrl?: string;
  url: string;
}

export interface SavedSearchResource {
  id: string;
  name: string;
  filters: Record<string, any>;
  resultCount: number;
  lastRunAt: string | null;
  createdAt: string;
}

export interface AuctionFacet {
  field: string;
  value: string;
  count: number;
  label: string;
}

export interface SearchFacetsResponse {
  categories: AuctionFacet[];
  conditions: AuctionFacet[];
  locations: AuctionFacet[];
}
