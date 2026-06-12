<?php

namespace App\Events\Auction;

use App\Models\Auction;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Auction $auction,
        public string $approvedByUserId
    ) {}
}
