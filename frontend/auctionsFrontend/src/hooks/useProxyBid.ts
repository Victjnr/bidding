import { useGetProxyBidQuery, usePlaceProxyBidMutation, useCancelProxyBidMutation } from '@/store/api/auctionApi';

export function useProxyBid(auctionUuid: string) {
  const { data: currentProxy, isLoading: isLoadingProxy } = useGetProxyBidQuery(auctionUuid, { skip: !auctionUuid });
  const [placeProxyBid, { isLoading: isPlacing }] = usePlaceProxyBidMutation();
  const [cancelProxyBid, { isLoading: isCanceling }] = useCancelProxyBidMutation();

  const setProxy = async (maxAmount: number) => {
    await placeProxyBid({ auctionUuid, maxAmount }).unwrap();
  };

  const cancelProxy = async () => {
    await cancelProxyBid(auctionUuid).unwrap();
  };

  return {
    currentProxy,
    isActive: !!currentProxy && !currentProxy.isExhausted,
    isLoading: isLoadingProxy || isPlacing || isCanceling,
    isPlacing,
    setProxy,
    cancelProxy,
  };
}
