<?php

namespace App\DTOs\Bid;

readonly class BidResultDTO
{
    public function __construct(
        public string $bidUuid,
        public float $amount,
        public bool $isWinning,
        public float $currentPrice,
        public int $totalBids,
        public bool $isReserveMet,
        public float $nextMinimumBid,
        public int $timeRemainingSeconds,
    ) {}
}
