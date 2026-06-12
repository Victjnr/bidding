<?php

namespace App\DTOs\Auction;

readonly class ApproveAuctionDTO
{
    public function __construct(
        public string $approvedByUserId
    ) {}
}
