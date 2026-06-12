import { useParams, Link } from 'react-router-dom';
import { Share2, Heart, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useGetAuctionQuery } from '@/store/api/auctionApi';
import { ImageGallery } from './components/ImageGallery';
import { SellerCard } from './components/SellerCard';
import { AuctionMetaList } from './components/AuctionMetaList';
import { BidPanel } from '../bidding/BidPanel';
import { LiveBidFeed } from '../bidding/LiveBidFeed';
import { WatchlistButton } from '@/components/shared/WatchlistButton';

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: auction, isLoading, error } = useGetAuctionQuery(id || '');

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange" />
      </div>
    );
  }

  if (error || !auction) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="h-12 w-12 text-error mb-4" />
        <h2 className="font-display text-2xl font-bold text-ink">Auction Not Found</h2>
        <p className="mt-2 text-muted">The auction you're looking for doesn't exist or has been removed.</p>
        <Link to="/app/auctions" className="btn-primary mt-6">Back to Auctions</Link>
      </div>
    );
  }

  const primaryImage = auction.media?.[0]?.cdnUrl ?? '';

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Helmet>
        <title>{auction.title} — Upload Auctions</title>
        <meta name="description" content={`Bid on ${auction.title}. Current price: $${auction.currentPrice?.toLocaleString()}. ${auction.category?.name} auction on Upload Auctions.`} />
        <meta property="og:title" content={auction.title} />
        <meta property="og:description" content={`Current bid: $${auction.currentPrice?.toLocaleString()}`} />
        <meta property="og:image" content={primaryImage} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center text-sm font-medium text-muted">
        <Link to="/app" className="hover:text-orange">Home</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <Link to="/app/auctions" className="hover:text-orange">Auctions</Link>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="text-ink truncate">{auction.category.name}</span>
      </nav>

      {/* Title Area (Mobile mainly, Desktop can show it in content) */}
      <div className="mb-6 lg:hidden">
        <h1 className="font-display text-2xl font-bold text-navy">{auction.title}</h1>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Left Column (Media & Description) */}
        <div className="flex-1 space-y-8">
          <ImageGallery media={auction.media} />

          <div className="hidden lg:block">
            <h1 className="font-display text-3xl font-bold text-navy mb-4">{auction.title}</h1>
          </div>

          <div className="prose prose-slate max-w-none prose-headings:font-display prose-a:text-orange">
            <div dangerouslySetInnerHTML={{ __html: auction.description }} />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:hidden">
             {/* Show on mobile below description */}
             <SellerCard seller={auction.seller} />
             <AuctionMetaList auction={auction} />
          </div>
        </div>

        {/* Right Column (Bid Panel & Meta) */}
        <div className="w-full shrink-0 space-y-6 lg:w-[400px]">
          <div className="sticky top-24 space-y-6">
            <BidPanel auction={auction} />

            <div className="flex gap-4">
              <WatchlistButton auctionUuid={auction.uuid} initialCount={12} />
              <button className="btn-outline flex-1 gap-2 border-border">
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            <LiveBidFeed auctionUuid={auction.uuid} />

            <div className="hidden lg:block space-y-6">
              <SellerCard seller={auction.seller} />
              <AuctionMetaList auction={auction} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
