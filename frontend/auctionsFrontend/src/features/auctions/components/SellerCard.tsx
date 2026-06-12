import { Star, ShieldCheck, MapPin } from 'lucide-react';
import type { UserMinimal } from '@/types/auction';
import { format } from 'date-fns';

export function SellerCard({ seller }: { seller: UserMinimal }) {
  const rating = seller.rating || 0;
  
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted">About the Seller</h3>
      
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy text-xl font-bold text-white shadow-inner">
          {seller.avatarPath ? (
            <img src={seller.avatarPath} alt={seller.displayName} className="h-full w-full rounded-full object-cover" />
          ) : (
            seller.displayName.charAt(0).toUpperCase()
          )}
        </div>
        
        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-display font-semibold text-ink text-lg">{seller.displayName}</h4>
            {(seller as any).trustScore >= 95 && <ShieldCheck className="h-4 w-4 text-orange" />}
          </div>
          
          <div className="mt-1 flex items-center gap-3 text-sm text-muted">
            {/* Rating Stars */}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-orange text-orange" />
              <span className="font-medium text-ink">{rating.toFixed(1)}</span>
              <span className="text-xs">(124)</span>
            </div>
            
            {/* Location stub since UserMinimal doesn't hold location usually, maybe just member since */}
            {seller.memberSince && (
              <span className="text-xs">
                Member since {format(new Date(seller.memberSince), 'MMM yyyy')}
              </span>
            )}
          </div>
        </div>
        
        {/* Action */}
        <div>
          <button className="btn-outline whitespace-nowrap px-3 py-1.5 text-sm">
            Contact
          </button>
        </div>
      </div>
    </div>
  );
}
