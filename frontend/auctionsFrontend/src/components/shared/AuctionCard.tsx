import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Clock, Users, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow, isPast, differenceInMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import type { AuctionResource } from '@/types/auction';

interface AuctionCardProps {
  auction: AuctionResource;
  variant?: 'grid' | 'list' | 'compact';
  onClick?: () => void;
}

export function AuctionCard({ auction, variant = 'grid', onClick }: AuctionCardProps) {
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const primaryMedia = auction.media.find(m => m.isPrimary) || auction.media[0];

  const now = new Date();
  const endsAt = new Date(auction.endAt);
  const hasEnded = isPast(endsAt);
  const minsRemaining = differenceInMinutes(endsAt, now);

  const getTimerColor = () => {
    if (hasEnded) return 'text-muted';
    if (minsRemaining < 5) return 'text-error animate-pulse font-bold';
    if (minsRemaining < 60) return 'text-orange font-semibold';
    return 'text-success';
  };

  const formattedTimeLeft = hasEnded
    ? 'Ended'
    : formatDistanceToNow(endsAt, { addSuffix: true });

  const isList = variant === 'list';
  const isCompact = variant === 'compact';

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all hover:shadow-elevated border border-border flex",
        isList ? "flex-row h-48" : "flex-col",
        isCompact && "flex-col"
      )}
    >
      {/* Media Area */}
      <div className={cn(
        "relative overflow-hidden bg-sky",
        isList ? "w-1/3 min-w-[200px]" : "w-full",
        isCompact ? "aspect-square" : "aspect-video"
      )}>
        {primaryMedia ? (
          <img
            src={primaryMedia.cdnUrl}
            alt={auction.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            No Image
          </div>
        )}

        {/* Badges Overlay */}
        <div className="absolute left-3 top-3 flex flex-col gap-2">
          <span className="rounded-full bg-navy/90 px-2.5 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
            {auction.auctionType.toUpperCase()}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsWatchlisted(!isWatchlisted);
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-muted shadow-sm backdrop-blur-sm transition-colors hover:text-orange focus:outline-none focus:ring-2 focus:ring-orange focus:ring-offset-2"
          aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Heart
            className={cn("h-4 w-4 transition-all", isWatchlisted && "fill-orange text-orange scale-110")}
          />
        </button>

        {/* Status Overlay for Ended */}
        {hasEnded && (
          <div className="absolute inset-0 flex items-center justify-center bg-navy/60 backdrop-blur-[2px]">
            <span className="rounded bg-white px-3 py-1 font-display font-bold text-navy">
              {auction.status === 'sold' ? 'SOLD' : 'ENDED'}
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className={cn("flex flex-1 flex-col", isCompact ? "p-3" : "p-4")}>
        <div className="mb-2">
          {onClick ? (
            <button onClick={onClick} className="focus:outline-none text-left w-full">
              <h3 className={cn(
                "font-display font-semibold text-ink line-clamp-2 transition-colors group-hover:text-orange",
                isCompact ? "text-sm" : "text-base"
              )}>
                <span className="absolute inset-0 z-0" aria-hidden="true" />
                {auction.title}
              </h3>
            </button>
          ) : (
            <Link to={`/app/auctions/${auction.uuid}`} className="focus:outline-none text-left w-full">
              <h3 className={cn(
                "font-display font-semibold text-ink line-clamp-2 transition-colors group-hover:text-orange",
                isCompact ? "text-sm" : "text-base"
              )}>
                <span className="absolute inset-0 z-0" aria-hidden="true" />
                {auction.title}
              </h3>
            </Link>
          )}
        </div>

        <div className="mt-auto space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wider mb-0.5">Current Bid</p>
              <p className={cn(
                "font-display font-bold text-orange leading-none",
                isCompact ? "text-lg" : "text-xl"
              )}>
                {auction.currency} {auction.currentPrice.toLocaleString()}
              </p>
            </div>
            {!isCompact && (
              <div className="text-right">
                <div className="flex items-center justify-end gap-1 text-xs text-muted mb-1">
                  <Users className="h-3 w-3" />
                  <span>{auction.totalBids} bids</span>
                </div>
                {auction.isReserveMet && (
                  <div className="flex items-center justify-end gap-1 text-[10px] font-medium text-success uppercase">
                    <CheckCircle2 className="h-3 w-3" />
                    Reserve Met
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="flex items-center gap-1.5">
              <Clock className={cn("h-3.5 w-3.5", getTimerColor())} />
              <span className={cn("text-xs", getTimerColor())}>
                {formattedTimeLeft}
              </span>
            </div>
            
            {/* Sliding CTA button on hover */}
            {!isCompact && (
              <div className="relative h-6 w-20 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-end text-xs font-medium text-muted transition-transform duration-300 group-hover:-translate-y-full">
                  {auction.condition.replace('_', ' ')}
                </div>
                <div className="absolute inset-0 flex items-center justify-end text-xs font-bold text-orange translate-y-full transition-transform duration-300 group-hover:translate-y-0">
                  Place Bid →
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
