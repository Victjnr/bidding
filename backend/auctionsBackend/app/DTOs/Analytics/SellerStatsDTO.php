<?php

namespace App\DTOs\Analytics;

readonly class SellerStatsDTO
{
    public function __construct(
        public int $activeListings,
        public int $totalBidsToday,
        public float $gmvThisMonth,
        public float $pendingPayouts,
    ) {}
}
