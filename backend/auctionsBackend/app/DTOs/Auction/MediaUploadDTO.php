<?php

namespace App\DTOs\Auction;

readonly class MediaUploadDTO
{
    public function __construct(
        public string $auctionId,
        /** @var \Illuminate\Http\UploadedFile[] */
        public array $files,
        public bool $isPrimary = false
    ) {}
}
