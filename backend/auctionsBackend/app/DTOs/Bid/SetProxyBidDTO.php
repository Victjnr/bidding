<?php

namespace App\DTOs\Bid;

readonly class SetProxyBidDTO
{
    public function __construct(
        public string $auctionUuid,
        public int $bidderId,
        public float $maxAmount,
    ) {}
}
