<?php

namespace App\DTOs\Bid;

use App\Enums\BidType;

readonly class PlaceBidDTO
{
    public function __construct(
        public string $auctionUuid,
        public int $bidderId,
        public float $amount,
        public BidType $type,
        public string $ipAddress,
        public ?string $deviceFingerprint = null,
    ) {}
}
