import { useEffect, useState } from 'react';
import { useAppDispatch } from '@/hooks/useRedux';
import { auctionApi } from '@/store/api/auctionApi';
import type { AuctionClosedEvent, BidResource } from '@/types/bid';
import { useGetAuctionQuery } from '@/store/api/auctionApi';
import { getEcho } from '@/lib/echo';

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

    const echo = getEcho();
    if (!echo) {
      setConnectionStatus('disconnected');
      return;
    }

    setConnectionStatus('connecting');
    const channel = echo.private(`auction.${auctionUuid}`);

    channel.subscribed(() => {
      setConnectionStatus('connected');
    });

    channel.error(() => {
      setConnectionStatus('error');
    });

    const handleBidPlaced = (event: any) => {
      const bidId = String(event.bidId ?? event.bid_uuid ?? Date.now());
      const amount = Number(event.amount ?? event.currentPrice ?? event.current_price ?? 0);
      const bidderAlias = event.bidderAlias ?? event.bidder_alias ?? 'Bidder';
      const currentPrice = Number(event.currentPrice ?? event.current_price ?? amount);
      const totalBids = Number(event.totalBids ?? event.total_bids ?? 1);
      const isReserveMet = Boolean(event.isReserveMet ?? event.is_reserve_met ?? false);

      dispatch(
        auctionApi.util.updateQueryData('getBids', auctionUuid, (draftBids) => {
          const exists = draftBids.find((b) => String(b.uuid) === bidId || String(b.id) === bidId);
          if (!exists) {
            const newBid: BidResource = {
              id: Number(event.id) || Date.now(),
              uuid: bidId,
              auctionId: auctionUuid,
              amount,
              type: event.type ?? 'manual',
              bidderAlias,
              isWinning: true,
              createdAt: event.timestamp ?? new Date().toISOString(),
            };
            draftBids.forEach((b) => (b.isWinning = false));
            draftBids.unshift(newBid);
          }
        })
      );

      dispatch(
        auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
          draft.currentPrice = currentPrice;
          draft.totalBids = totalBids;
          draft.isReserveMet = isReserveMet;
        })
      );
    };

    const handleAuctionExtended = (event: any) => {
      const newEndAt = event.newEndAt ?? event.new_end_at;
      if (newEndAt) {
        dispatch(
          auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
            draft.endAt = newEndAt;
          })
        );
      }
    };

    const handleAuctionClosed = (event: any) => {
      setIsEnded(true);
      setWinnerData({
        auctionId: event.auctionId ?? event.auction_uuid ?? auctionUuid,
        winnerId: event.winnerId ?? event.winner_uuid ?? null,
        winnerAlias: event.winnerAlias ?? event.winner_alias ?? null,
        finalPrice: Number(event.finalPrice ?? event.final_price ?? 0),
        isReserveMet: Boolean(event.isReserveMet ?? event.is_reserve_met ?? true),
      });
      dispatch(
        auctionApi.util.updateQueryData('getAuction', auctionUuid, (draft) => {
          draft.status = 'sold';
          draft.isReserveMet = Boolean(event.isReserveMet ?? event.is_reserve_met ?? draft.isReserveMet);
        })
      );
    };

    channel.listen('.bid.placed', handleBidPlaced);
    channel.listen('.BidPlacedEvent', handleBidPlaced);
    channel.listen('.auction.extended', handleAuctionExtended);
    channel.listen('.AuctionExtendedEvent', handleAuctionExtended);
    channel.listen('.auction.closed', handleAuctionClosed);
    channel.listen('.AuctionClosedEvent', handleAuctionClosed);

    return () => {
      try {
        echo.leave(`auction.${auctionUuid}`);
      } catch {
        // ignore
      }
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
