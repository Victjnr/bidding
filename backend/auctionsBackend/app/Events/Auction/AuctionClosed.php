<?php

namespace App\Events\Auction;

use App\Models\Auction;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionClosed
{
    use Dispatchable, SerializesModels;

    public function __construct(public Auction $auction) {}
}
