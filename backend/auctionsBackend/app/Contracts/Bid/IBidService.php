<?php

namespace App\Contracts\Bid;

use App\DTOs\Bid\BidResultDTO;
use App\DTOs\Bid\PlaceBidDTO;
use App\DTOs\Bid\SetProxyBidDTO;
use App\Models\ProxyBid;

interface IBidService
{
    public function placeBid(PlaceBidDTO $dto): BidResultDTO;
    public function setProxyBid(SetProxyBidDTO $dto): ProxyBid;
    public function cancelProxyBid(string $auctionUuid, int $bidderId): void;
}
