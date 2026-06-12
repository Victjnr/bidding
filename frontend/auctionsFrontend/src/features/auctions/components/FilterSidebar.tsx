import { useState } from 'react';
import * as Accordion from '@radix-ui/react-collapsible';
import * as Checkbox from '@radix-ui/react-checkbox';
import * as Slider from '@radix-ui/react-slider';
import * as RadioGroup from '@radix-ui/react-radio-group';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuctionFilters, AuctionType } from '@/types/auction';

interface FilterSidebarProps {
  filters: AuctionFilters;
  onFilterChange: (filters: Partial<AuctionFilters>) => void;
  className?: string;
}

export function FilterSidebar({ filters, onFilterChange, className }: FilterSidebarProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(true);

  // Mock categories for the tree
  const categories = [
    { id: '1', name: 'Electronics', count: 124 },
    { id: '2', name: 'Vehicles', count: 56 },
    { id: '3', name: 'Real Estate', count: 12 },
    { id: '4', name: 'Art & Collectibles', count: 89 },
  ];

  const types: { value: AuctionType; label: string }[] = [
    { value: 'forward', label: 'Forward (English)' },
    { value: 'reverse', label: 'Reverse (Dutch)' },
    { value: 'sealed', label: 'Sealed Bid' },
    { value: 'bin', label: 'Buy It Now' },
  ];

  const handleTypeToggle = (type: AuctionType) => {
    const currentTypes = filters.type || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];
    onFilterChange({ type: newTypes });
  };

  const handlePriceChange = (value: number[]) => {
    onFilterChange({ minPrice: value[0], maxPrice: value[1] });
  };

  return (
    <div className={cn("w-full bg-white p-5 border-r border-border h-full overflow-y-auto", className)}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold text-ink text-lg">Filters</h3>
        <button
          onClick={() => onFilterChange({ category: undefined, type: [], minPrice: undefined, maxPrice: undefined, condition: [], endingSoon: false })}
          className="text-xs font-medium text-orange hover:underline focus:outline-none"
        >
          Clear all
        </button>
      </div>

      <div className="space-y-8">
        {/* Categories */}
        <Accordion.Root open={categoriesOpen} onOpenChange={setCategoriesOpen} className="space-y-3">
          <Accordion.Trigger className="flex w-full items-center justify-between text-sm font-semibold text-ink hover:text-orange focus:outline-none">
            Categories
            <ChevronDown className={cn("h-4 w-4 transition-transform", categoriesOpen && "rotate-180")} />
          </Accordion.Trigger>
          <Accordion.Content className="space-y-2 overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ category: cat.id })}
                className={cn(
                  "flex w-full items-center justify-between text-sm transition-colors hover:text-orange focus:outline-none",
                  filters.category === cat.id ? "text-orange font-medium" : "text-muted"
                )}
              >
                <span>{cat.name}</span>
                <span className="text-xs opacity-70">{cat.count}</span>
              </button>
            ))}
          </Accordion.Content>
        </Accordion.Root>

        {/* Auction Type */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink">Auction Type</h4>
          <div className="space-y-2.5">
            {types.map((type) => (
              <div key={type.value} className="flex items-center space-x-3">
                <Checkbox.Root
                  id={`type-${type.value}`}
                  checked={(filters.type || []).includes(type.value)}
                  onCheckedChange={() => handleTypeToggle(type.value)}
                  className="flex h-4 w-4 items-center justify-center rounded border border-border bg-white transition-colors hover:border-orange focus:outline-none focus:ring-2 focus:ring-orange/30 data-[state=checked]:bg-orange data-[state=checked]:border-orange"
                >
                  <Checkbox.Indicator>
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </Checkbox.Indicator>
                </Checkbox.Root>
                <label
                  htmlFor={`type-${type.value}`}
                  className="text-sm text-muted cursor-pointer hover:text-ink"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-ink">Price Range</h4>
          <Slider.Root
            className="relative flex w-full touch-none select-none items-center"
            value={[filters.minPrice || 0, filters.maxPrice || 10000]}
            max={10000}
            step={100}
            minStepsBetweenThumbs={1}
            onValueChange={handlePriceChange}
          >
            <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-sky">
              <Slider.Range className="absolute h-full rounded-full bg-orange" />
            </Slider.Track>
            <Slider.Thumb className="block h-4 w-4 rounded-full border border-orange bg-white shadow transition-colors focus:outline-none focus:ring-2 focus:ring-orange/30" />
            <Slider.Thumb className="block h-4 w-4 rounded-full border border-orange bg-white shadow transition-colors focus:outline-none focus:ring-2 focus:ring-orange/30" />
          </Slider.Root>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
              <input
                type="number"
                value={filters.minPrice || 0}
                onChange={(e) => onFilterChange({ minPrice: Number(e.target.value) })}
                className="w-full rounded-md border border-border bg-white px-6 py-1.5 text-sm text-ink focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
            <span className="text-muted">-</span>
            <div className="relative flex-1">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
              <input
                type="number"
                value={filters.maxPrice || 10000}
                onChange={(e) => onFilterChange({ maxPrice: Number(e.target.value) })}
                className="w-full rounded-md border border-border bg-white px-6 py-1.5 text-sm text-ink focus:border-orange focus:outline-none focus:ring-1 focus:ring-orange"
              />
            </div>
          </div>
        </div>

        {/* Condition */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-ink">Condition</h4>
          <RadioGroup.Root
            value={(filters.condition && filters.condition[0]) || ''}
            onValueChange={(val) => onFilterChange({ condition: val ? [val] : [] })}
            className="space-y-2.5"
          >
            <div className="flex items-center space-x-3">
              <RadioGroup.Item value="" id="cond-all" className="h-4 w-4 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 data-[state=checked]:border-orange flex items-center justify-center">
                <RadioGroup.Indicator className="h-2 w-2 rounded-full bg-orange" />
              </RadioGroup.Item>
              <label htmlFor="cond-all" className="text-sm text-muted cursor-pointer hover:text-ink">All</label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroup.Item value="new" id="cond-new" className="h-4 w-4 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 data-[state=checked]:border-orange flex items-center justify-center">
                <RadioGroup.Indicator className="h-2 w-2 rounded-full bg-orange" />
              </RadioGroup.Item>
              <label htmlFor="cond-new" className="text-sm text-muted cursor-pointer hover:text-ink">New</label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroup.Item value="used" id="cond-used" className="h-4 w-4 rounded-full border border-border bg-white focus:outline-none focus:ring-2 focus:ring-orange/30 data-[state=checked]:border-orange flex items-center justify-center">
                <RadioGroup.Indicator className="h-2 w-2 rounded-full bg-orange" />
              </RadioGroup.Item>
              <label htmlFor="cond-used" className="text-sm text-muted cursor-pointer hover:text-ink">Used</label>
            </div>
          </RadioGroup.Root>
        </div>

        {/* Ending Soon Toggle */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={() => onFilterChange({ endingSoon: !filters.endingSoon })}
            className={cn(
              "w-full rounded-full py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
              filters.endingSoon
                ? "bg-orange text-white focus:ring-orange"
                : "bg-sky text-muted hover:bg-sky/80 hover:text-ink focus:ring-sky"
            )}
          >
            🔥 Ending Soon
          </button>
        </div>
      </div>
    </div>
  );
}
