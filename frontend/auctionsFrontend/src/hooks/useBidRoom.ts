import { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useAppDispatch } from '@/hooks/useRedux';
import { auctionApi } from '@/store/api/auctionApi';
import type { BidPlacedEvent, AuctionExtendedEvent, AuctionClosedEvent, BidResource } from '@/types/bid';
import { useGetAuctionQuery } from '@/store/api/auctionApi';

// Set up Pusher globally if not already set. In a real app this might be in a separate config file.
if (typeof window !== 'undefined') {
  (window as any).Pusher = Pusher;
}

export function useBidRoom(auctionUuid: string) {
  const dispatch = useAppDispatch();
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('disconnected');
  
  // Local state overrides for optimistic/real-time updates
  const [isEnded, setIsEnded] = useState(false);
  const [winnerData, setWinnerData] = useState<AuctionClosedEvent | null>(null);

  // We can fetch initial data to seed the state
  const { data: auction } = useGetAuctionQuery(auctionUuid, { skip: !auctionUuid });

  useEffect(() => {
    if (!auctionUuid) return;

    // We assume Echo is configured via environment variables.
    // Replace these with your actual Laravel Echo Pusher configuration.
    const echo = new Echo({
      broadcaster: 'pusher',
      key: import.meta.env.VITE_PUSHER_APP_KEY || 'app-key',
      cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
      forceTLS: true,
      authEndpoint: `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`, // or from redux state
        },
      },
    });

    setConnectionStatus('connecting');
    const channel = echo.private(`auction.${auctionUuid}`);

    channel.subscribed(() => {
      setConnectionStatus('connected');
    });

    channel.error(() => {
      setConnectionStatus('error');
    });

    // ─── Event Handlers ───
    channel.listen('.BidPlacedEvent', (event: BidPlacedEvent) => {
      // Optimistically update the RTK Query cache for this auction's bids
      dispatch(
        auctionApi.util.updateQueryData('getBids', auctionUuid, (draftBids) => {
          // Check if bid already exists
          const exists = draftBids.find((b) => b.id.toString() === event.bidId);
          if (!exists) {
            const newBid: BidResource = {
              id: Number(event.bidId),
              uuid: event.bidId,
              auctionId: auctionUuid,
              amount: event.amount,
              type: 'manual', // Simplification, backend would send type ideally
              bidderAlias: event.bidderAlias,
              isWinning: true, // Optimistically winning
              createdAt: new Date().toISOString(),
            };
            // Mark all others as non-winning
            draftBids.forEach((b) => (b.isWinning = false));
            draftBids.unshift(newBid);
          }
        })
      );

      // Optimistically update the auction resource cache
      dispatch(
        auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
          draft.currentPrice = event.currentPrice;
          draft.totalBids = event.totalBids;
          draft.isReserveMet = event.isReserveMet;
        })
      );
    });

    channel.listen('.AuctionExtendedEvent', (event: AuctionExtendedEvent) => {
      dispatch(
        auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
          draft.endAt = event.newEndAt;
        })
      );
    });

    channel.listen('.AuctionClosedEvent', (event: AuctionClosedEvent) => {
      setIsEnded(true);
      setWinnerData(event);
      dispatch(
        auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
          draft.status = 'sold';
          draft.isReserveMet = event.isReserveMet;
        })
      );
    });

    return () => {
      echo.leave(`auction.${auctionUuid}`);
      echo.disconnect();
      setConnectionStatus('disconnected');
    };
  }, [auctionUuid, dispatch]);

  return {
    currentPrice: auction?.currentPrice || 0,
    totalBids: auction?.totalBids || 0,
    isReserveMet: auction?.isReserveMet || false,
    nextMinBid: auction?.currentPrice ? auction.currentPrice + (typeof auction.bidIncrement === 'number' ? auction.bidIncrement : 1) : 0,
    endAt: auction?.endAt || '',
    isEnded: isEnded || auction?.status === 'sold' || auction?.status === 'ended',
    winnerData,
    connectionStatus,
  };
}
