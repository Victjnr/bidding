import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Clock, Loader2, AlertCircle } from 'lucide-react';
import { useGetAuctionQuery } from '@/store/api/auctionApi';
import { ImageGallery } from './ImageGallery';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { formatDistanceToNowStrict } from 'date-fns';

interface AuctionDetailsModalProps {
  auctionId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AuctionDetailsModal({ auctionId, isOpen, onClose }: AuctionDetailsModalProps) {
  const { data: auction, isLoading, isError } = useGetAuctionQuery(auctionId!, {
    skip: !auctionId || !isOpen,
  });
  const { isAuthenticated } = useAuth();
  
  // Timer state
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!auction?.endAt) return;
    
    const updateTimer = () => {
      const end = new Date(auction.endAt);
      if (end <= new Date()) {
        setTimeLeft('Ended');
      } else {
        setTimeLeft(formatDistanceToNowStrict(end, { addSuffix: true }));
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [auction?.endAt]);

  const handlePlaceBidClick = () => {
    if (!isAuthenticated) {
      toast.error(
        <span>
          Please <Link to="/auth/login" className="underline font-bold">log in</Link> to place a bid.
        </span>,
        { duration: 4000 }
      );
      onClose(); // Optional: close modal to direct to login
      return;
    }
    // Handle real bid logic here if authenticated
    toast.success('Bid flow triggered (placeholder)');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] overflow-hidden rounded-2xl bg-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          
          {/* Header area with close button */}
          <div className="absolute right-4 top-4 z-10">
            <Dialog.Close asChild>
              <button className="rounded-full bg-white/80 p-2 text-ink shadow-sm backdrop-blur hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-[90vh] overflow-y-auto p-0">
            {isLoading && (
              <div className="flex h-96 flex-col items-center justify-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-orange" />
                <p className="text-muted">Loading auction details...</p>
              </div>
            )}
            
            {isError && (
              <div className="flex h-96 flex-col items-center justify-center gap-3 text-error">
                <AlertCircle className="h-10 w-10" />
                <p>Failed to load auction details. Please try again.</p>
              </div>
            )}

            {auction && !isLoading && !isError && (
              <div className="grid grid-cols-1 md:grid-cols-2">
                
                {/* Left side: Images */}
                <div className="bg-sky/30 p-6 md:p-8 flex items-center justify-center">
                  <div className="w-full max-w-sm">
                    <ImageGallery media={auction.media || []} />
                  </div>
                </div>

                {/* Right side: Details */}
                <div className="flex flex-col p-6 md:p-8">
                  <div className="flex-1">
                    <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-orange/10 px-3 py-1 text-sm font-medium text-orange">
                      <Clock className="h-4 w-4" />
                      {timeLeft}
                    </div>

                    <Dialog.Title className="font-display text-2xl font-bold text-ink sm:text-3xl mb-2">
                      {auction.title}
                    </Dialog.Title>
                    
                    <p className="mb-6 text-sm text-muted">
                      Category: <span className="font-medium text-ink">{auction.category?.name || 'Uncategorized'}</span>
                    </p>

                    <div className="mb-6 rounded-xl border border-border bg-gray-50 p-4">
                      <p className="text-sm text-muted uppercase tracking-wider mb-1">Current Price</p>
                      <p className="font-display text-4xl font-bold text-ink">
                        {auction.currency} {auction.currentPrice.toLocaleString()}
                      </p>
                    </div>

                    <div className="prose prose-sm text-muted">
                      <p>{auction.description}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border">
                    <button
                      onClick={handlePlaceBidClick}
                      className="btn-primary w-full py-4 text-lg font-semibold shadow-lg shadow-orange/30 transition-all hover:shadow-orange/50 hover:-translate-y-0.5"
                    >
                      Place Bid
                    </button>
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
