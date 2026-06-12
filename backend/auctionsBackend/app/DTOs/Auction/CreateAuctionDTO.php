<?php

namespace App\DTOs\Auction;

use App\Enums\AuctionType;
use Carbon\CarbonInterface;

readonly class CreateAuctionDTO
{
    public function __construct(
        public string $title,
        public string $description,
        public AuctionType $auctionType,
        public int $categoryId,
        public string $condition,
        public string $locationCountry,
        public string $locationCity,
        public string $currencyCode,
        public float $startPrice,
        public ?float $reservePrice,
        public ?float $binPrice,
        public string $bidIncrementType,
        public float $bidIncrementValue,
        public bool $depositRequired,
        public ?float $depositAmount,
        public CarbonInterface $startAt,
        public CarbonInterface $endAt,
        public int $antiSnipeMinutes,
        public int $antiSnipeExtendMinutes,
        public int $maxExtensionMinutes,
    ) {}
}
