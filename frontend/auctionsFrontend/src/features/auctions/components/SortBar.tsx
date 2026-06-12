import { LayoutGrid, List } from 'lucide-react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuctionFilters } from '@/types/auction';

interface SortBarProps {
  totalResults: number;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  filters: AuctionFilters;
  onFilterChange: (filters: Partial<AuctionFilters>) => void;
}

export function SortBar({ totalResults, viewMode, onViewModeChange, filters, onFilterChange }: SortBarProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      <p className="text-sm font-medium text-muted">
        Showing <span className="font-bold text-ink">{totalResults}</span> results
      </p>

      <div className="flex items-center gap-4">
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Sort by:</span>
          <Select.Root
            value={filters.sortBy || 'newest'}
            onValueChange={(val: any) => onFilterChange({ sortBy: val })}
          >
            <Select.Trigger className="flex h-9 items-center justify-between gap-2 rounded-md border border-border bg-white px-3 py-2 text-sm text-ink focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange">
              <Select.Value />
              <Select.Icon>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Select.Icon>
            </Select.Trigger>
            <Select.Portal>
              <Select.Content className="overflow-hidden rounded-md border border-border bg-white shadow-elevated z-50">
                <Select.Viewport className="p-1">
                  <SelectItem value="newest">Newly Listed</SelectItem>
                  <SelectItem value="ending_soonest">Ending Soonest</SelectItem>
                  <SelectItem value="price_asc">Price: Low to High</SelectItem>
                  <SelectItem value="price_desc">Price: High to Low</SelectItem>
                  <SelectItem value="bids_desc">Most Bids</SelectItem>
                </Select.Viewport>
              </Select.Content>
            </Select.Portal>
          </Select.Root>
        </div>

        {/* View Toggle */}
        <div className="flex items-center rounded-md border border-border bg-white p-0.5">
          <button
            onClick={() => onViewModeChange('grid')}
            className={cn(
              "rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-1",
              viewMode === 'grid' ? "bg-sky text-navy shadow-sm" : "text-muted hover:text-ink"
            )}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={cn(
              "rounded p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-1",
              viewMode === 'list' ? "bg-sky text-navy shadow-sm" : "text-muted hover:text-ink"
            )}
            aria-label="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const SelectItem = ({ children, className, ...props }: any) => {
  return (
    <Select.Item
      className={cn(
        "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm text-ink outline-none focus:bg-sky focus:text-orange data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <Select.ItemIndicator>
          <Check className="h-4 w-4 text-orange" />
        </Select.ItemIndicator>
      </span>
      <Select.ItemText>{children}</Select.ItemText>
    </Select.Item>
  );
};
