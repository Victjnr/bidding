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

const AUCTION_TYPES: {
  value: AuctionType;
  label: string;
  description: string;
  icon: React.ElementType;
}[] = [
  {
    value: 'forward',
    label: 'Forward (English)',
    description: 'Classic ascending-price auction. The highest bidder wins when time expires.',
    icon: ArrowUpRight,
  },
  {
    value: 'reverse',
    label: 'Reverse (Dutch)',
    description: 'Price starts high and drops over time. First bidder to accept the price wins.',
    icon: ArrowDownRight,
  },
  {
    value: 'sealed',
    label: 'Sealed Bid',
    description: 'All bids are hidden. The highest bidder is revealed only when the auction closes.',
    icon: Lock,
  },
  {
    value: 'penny',
    label: 'Penny Auction',
    description: 'Each bid raises the price by a small increment. Every bid costs a token.',
    icon: Coins,
  },
  {
    value: 'bin',
    label: 'Buy It Now',
    description: 'Fixed-price listing. The first buyer to pay the listed price wins immediately.',
    icon: ShoppingCart,
  },
  {
    value: 'live',
    label: 'Live Auction',
    description: 'Real-time auctioneer-led session with live bidding via video and chat.',
    icon: Radio,
  },
];

interface TypeSelectorProps {
  selected: AuctionType | null;
  onSelect: (type: AuctionType) => void;
}

export function TypeSelector({ selected, onSelect }: TypeSelectorProps) {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl font-bold text-ink">Choose Auction Type</h2>
        <p className="mt-2 text-sm text-muted">
          Select the format that best suits your item. This determines how bids are placed and winners decided.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {AUCTION_TYPES.map((type) => {
          const Icon = type.icon;
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
