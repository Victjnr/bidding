import { Tag, MapPin, PackageOpen, Globe, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { AuctionResource } from '@/types/auction';

export function AuctionMetaList({ auction }: { auction: AuctionResource }) {
  const metaItems = [
    {
      icon: Tag,
      label: 'Auction Type',
      value: auction.auctionType.charAt(0).toUpperCase() + auction.auctionType.slice(1),
    },
    {
      icon: PackageOpen,
      label: 'Condition',
      value: auction.condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    },
    {
      icon: MapPin,
      label: 'Item Location',
      value: auction.location || 'Not specified',
    },
    {
      icon: Globe,
      label: 'Currency',
      value: auction.currency.toUpperCase(),
    },
    {
      icon: Calendar,
      label: 'Ends At',
      value: format(new Date(auction.endAt), 'PPpp'),
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">Auction Details</h3>
      <ul className="space-y-4">
        {metaItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-navy">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <p className="text-sm font-semibold text-ink">{item.value}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
