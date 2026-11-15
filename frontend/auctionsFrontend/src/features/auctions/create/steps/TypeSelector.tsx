import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Coins,
  ShoppingCart,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AuctionType } from '@/types/auction';
import { useGetDropdownOptionsQuery } from '@/store/api/auctionApi';

// Icon mapping string to component
const ICON_MAP: Record<string, React.ElementType> = {
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Coins,
  ShoppingCart,
  Radio,
};

interface TypeSelectorProps {
  selected: AuctionType | null;
  onSelect: (type: AuctionType) => void;
}

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  const { data: optionsData } = useGetDropdownOptionsQuery();
  const dynamicAuctionTypes = optionsData?.data?.auctionTypes || [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Choose Auction Type</h2>
        <p className="mt-2 text-sm text-muted">
          Select the format that best suits your item. This determines how bids are placed and winners decided.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {dynamicAuctionTypes.map((type: any) => {
          const Icon = ICON_MAP[type.icon] || ArrowUpRight;
          const isSelected = selected === type.value;

          return (
            <motion.button
              key={type.value}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(type.value)}
              className={cn(
                'group flex flex-col items-start rounded-xl border-2 p-5 text-left transition-all focus:outline-none focus:ring-2 focus:ring-orange/30 focus:ring-offset-2',
                isSelected
                  ? 'border-orange bg-orange/5 shadow-md shadow-orange/10'
                  : 'border-border bg-white hover:border-orange/40 hover:shadow-sm',
              )}
            >
              <div
                className={cn(
                  'mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                  isSelected ? 'bg-orange text-white' : 'bg-sky text-navy group-hover:bg-orange/10 group-hover:text-orange',
                )}
              >
                <Icon className="h-6 w-6" />
              </div>

              <h3 className={cn('font-display text-base font-bold', isSelected ? 'text-orange' : 'text-ink')}>
                {type.label}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{type.description}</p>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
