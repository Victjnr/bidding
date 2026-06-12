import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, X, Clock, Gavel, Folder } from 'lucide-react';
import { useGetSearchSuggestionsQuery } from '@/store/api/searchApi';
import { useDebounce } from '@/hooks/useDebounce';
import * as Popover from '@radix-ui/react-popover';
import { cn } from '@/lib/utils';
import type { SearchSuggestion } from '@/types/search';

export function GlobalSearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  const { data: suggestions = [], isFetching } = useGetSearchSuggestionsQuery(debouncedQuery, {
    skip: debouncedQuery.length < 2,
  });

  // Close dropdown on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  // Reset selected index when suggestions change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else if (query.trim()) {
        submitSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const submitSearch = (searchQuery: string) => {
    setIsOpen(false);
    inputRef.current?.blur();
    navigate(`/app/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setIsOpen(false);
    navigate(suggestion.url);
    if (suggestion.type === 'recent_search') {
      setQuery(suggestion.title);
    }
  };

  const groupedSuggestions = suggestions.reduce<Record<string, SearchSuggestion[]>>((acc, curr) => {
    const group = curr.type;
    if (!acc[group]) acc[group] = [];
    acc[group].push(curr);
    return acc;
  }, {});

  const renderIcon = (type: string) => {
    switch (type) {
      case 'auction': return <Gavel className="h-4 w-4 text-orange" />;
      case 'category': return <Folder className="h-4 w-4 text-sky-600" />;
      case 'recent_search': return <Clock className="h-4 w-4 text-muted" />;
      default: return <Search className="h-4 w-4 text-muted" />;
    }
  };

  // Flatten for keyboard navigation mapping
  const flatSuggestions = [
    ...(groupedSuggestions['recent_search'] || []),
    ...(groupedSuggestions['category'] || []),
    ...(groupedSuggestions['auction'] || []),
  ];

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Anchor asChild>
        <div className="relative w-full lg:w-[320px] transition-all duration-200 focus-within:lg:w-[400px]">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className={cn("h-4 w-4 transition-colors", isOpen ? "text-orange" : "text-muted")} />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="input h-10 w-full bg-sky/50 pl-10 pr-10 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-orange/20"
            placeholder="Search auctions, categories..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 0) setIsOpen(true);
            }}
            onFocus={() => {
              if (query.length > 0) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="z-50 w-[calc(100vw-32px)] lg:w-[400px] rounded-xl border border-border bg-white shadow-elevated animate-in fade-in-0 zoom-in-95 overflow-hidden"
        >
          <div className="max-h-[400px] overflow-y-auto py-2 scrollbar-hide">
            {isFetching ? (
              <div className="px-4 py-8 text-center text-sm text-muted animate-pulse">
                Searching...
              </div>
            ) : flatSuggestions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Search className="mx-auto mb-2 h-8 w-8 text-muted/30" />
                <p className="text-sm text-muted">No results found for "{query}"</p>
              </div>
            ) : (
              <>
                {/* Recent Searches */}
                {groupedSuggestions['recent_search']?.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Recent Searches
                    </div>
                    {groupedSuggestions['recent_search'].map((suggestion) => {
                      const globalIndex = flatSuggestions.indexOf(suggestion);
                      return (
                        <SuggestionRow 
                          key={suggestion.id}
                          suggestion={suggestion} 
                          icon={renderIcon('recent_search')}
                          isActive={globalIndex === selectedIndex}
                          onSelect={() => handleSelectSuggestion(suggestion)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Categories */}
                {groupedSuggestions['category']?.length > 0 && (
                  <div className="mb-2">
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Categories
                    </div>
                    {groupedSuggestions['category'].map((suggestion) => {
                      const globalIndex = flatSuggestions.indexOf(suggestion);
                      return (
                        <SuggestionRow 
                          key={suggestion.id}
                          suggestion={suggestion} 
                          icon={renderIcon('category')}
                          isActive={globalIndex === selectedIndex}
                          onSelect={() => handleSelectSuggestion(suggestion)}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Auctions */}
                {groupedSuggestions['auction']?.length > 0 && (
                  <div>
                    <div className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                      Auctions
                    </div>
                    {groupedSuggestions['auction'].map((suggestion) => {
                      const globalIndex = flatSuggestions.indexOf(suggestion);
                      return (
                        <SuggestionRow 
                          key={suggestion.id}
                          suggestion={suggestion} 
                          icon={renderIcon('auction')}
                          isActive={globalIndex === selectedIndex}
                          onSelect={() => handleSelectSuggestion(suggestion)}
                        />
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Footer Action */}
          <div className="border-t border-border bg-sky/30 p-2">
            <button
              onClick={() => submitSearch(query)}
              className="w-full rounded-md px-3 py-2 text-center text-sm font-medium text-orange hover:bg-orange/10 transition-colors"
            >
              See all results for "{query}"
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function SuggestionRow({ 
  suggestion, 
  icon, 
  isActive, 
  onSelect 
}: { 
  suggestion: SearchSuggestion; 
  icon: React.ReactNode; 
  isActive: boolean; 
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
        isActive ? "bg-sky" : "hover:bg-sky/50"
      )}
    >
      {suggestion.imageUrl ? (
        <img src={suggestion.imageUrl} alt="" className="h-8 w-8 rounded-md object-cover border border-border" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white border border-border">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink truncate">{suggestion.title}</p>
        {suggestion.subtitle && (
          <p className="text-xs text-muted truncate">{suggestion.subtitle}</p>
        )}
      </div>
    </button>
  );
}
