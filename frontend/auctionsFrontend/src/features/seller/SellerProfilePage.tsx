import { useParams, useNavigate } from 'react-router-dom';
import { useGetSellerProfileQuery, useGetSellerListingsQuery } from '@/store/api/sellerApi';
import { ShieldCheck, MessageSquare, Star, Calendar, Package, AlertCircle } from 'lucide-react';
import { AuctionCard } from '@/components/shared/AuctionCard';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function SellerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profileData, isLoading: profileLoading } = useGetSellerProfileQuery(id ?? '', { skip: !id });
  const { data: listingsData, isLoading: listingsLoading } = useGetSellerListingsQuery({ page: 1, status: 'active' }, { skip: !id }); // In a real app, this endpoint would need to accept a sellerId filter if fetched by a public user

  const profile = profileData?.profile;
  const reviews = profileData?.reviews ?? [];
  const listings = listingsData?.data ?? [];

  if (profileLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-64 rounded-3xl bg-sky/50" />
        <div className="h-96 rounded-2xl bg-sky/30" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-20 text-center">
        <AlertCircle className="mx-auto mb-4 h-12 w-12 text-error/50" />
        <h1 className="font-display text-2xl font-bold text-ink">Seller Not Found</h1>
        <p className="text-muted mt-2">The profile you are looking for does not exist or has been removed.</p>
        <button onClick={() => navigate(-1)} className="btn-outline mt-6">Go Back</button>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-16">
      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-3xl bg-navy p-8 text-white shadow-xl sm:p-12">
        <div 
          className="absolute inset-0 opacity-5" 
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")` }}
        />
        
        <div className="relative z-10 flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
          <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-4 border-white/10 bg-sky text-4xl font-bold text-navy shadow-inner">
            {profile.avatarPath ? (
              <img src={profile.avatarPath} alt={profile.displayName} className="h-full w-full rounded-full object-cover" />
            ) : (
              profile.displayName.charAt(0).toUpperCase()
            )}
          </div>
          
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {profile.displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                <div className="flex items-center gap-1.5 text-orange">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="font-bold text-lg">{profile.rating.toFixed(1)}</span>
                  <span className="text-sm text-sky/60">({reviews.length} reviews)</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky/80 text-sm">
                  <Calendar className="h-4 w-4" />
                  Joined {format(new Date(profile.memberSince), 'MMMM yyyy')}
                </div>
                <div className="flex items-center gap-1.5 text-sky/80 text-sm">
                  <Package className="h-4 w-4" />
                  {profile.totalSales.toLocaleString()} items sold
                </div>
              </div>
            </div>

            {/* Verifications */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {profile.verifications.email && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success border border-success/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Email Verified
                </span>
              )}
              {profile.verifications.identity && (
                <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-xs font-bold text-success border border-success/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> ID Verified
                </span>
              )}
              {profile.verifications.biometric && (
                <span className="inline-flex items-center gap-1 rounded-full bg-orange/20 px-3 py-1 text-xs font-bold text-orange border border-orange/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Biometric Verified
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <button 
              onClick={() => navigate('/app/messages/new?to=' + profile.uuid)}
              className="btn-primary gap-2 bg-white text-navy hover:bg-sky shadow-lg"
            >
              <MessageSquare className="h-4 w-4" /> Message Seller
            </button>
          </div>
        </div>
      </section>

      {/* Active Listings */}
      <section>
        <div className="mb-6 flex items-end justify-between">
          <h2 className="font-display text-2xl font-bold text-ink">Active Listings</h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {listingsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-sky/50" />)
          ) : listings.length === 0 ? (
            <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-border">
              <Package className="mx-auto mb-3 h-8 w-8 text-muted/30" />
              <p className="font-medium text-ink">No active listings</p>
              <p className="text-sm text-muted">This seller currently has no items up for auction.</p>
            </div>
          ) : (
            listings.map((auction) => (
              <AuctionCard key={auction.uuid} auction={auction} variant="grid" />
            ))
          )}
        </div>
      </section>

      {/* Reviews */}
      <section>
        <div className="mb-6">
          <h2 className="font-display text-2xl font-bold text-ink">Seller Reviews</h2>
        </div>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Summary Chart */}
          <div className="col-span-1 rounded-2xl border border-border bg-white p-6 shadow-sm h-fit">
            <div className="flex items-center gap-4 mb-6">
              <div className="text-5xl font-display font-bold text-ink">{profile.rating.toFixed(1)}</div>
              <div>
                <div className="flex text-orange">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("h-5 w-5", i < Math.round(profile.rating) ? "fill-current" : "text-border")} />
                  ))}
                </div>
                <p className="text-sm text-muted mt-1">Based on {reviews.length} reviews</p>
              </div>
            </div>
            
            {/* Mocked distribution bars for layout */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => Math.round(r.rating) === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-12 shrink-0 font-medium text-muted flex items-center justify-end gap-1">
                      {stars} <Star className="h-3 w-3" />
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-sky overflow-hidden">
                      <div className="h-full bg-orange rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs text-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Review List */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <div className="rounded-2xl border border-border bg-white p-8 text-center">
                <p className="text-muted">No reviews yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky font-bold text-navy">
                        {review.authorAlias.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-ink">{review.authorAlias}</p>
                        <p className="text-xs text-muted">{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</p>
                      </div>
                    </div>
                    <div className="flex text-orange">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4", i < review.rating ? "fill-current" : "text-border")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-ink text-sm leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
