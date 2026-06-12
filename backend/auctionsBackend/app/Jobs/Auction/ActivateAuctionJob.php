<?php

namespace App\Jobs\Auction;

use App\Contracts\Auction\IAuctionService;
use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ActivateAuctionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public Auction $auction)
    {}

    public function handle(IAuctionService $auctionService): void
    {
        // Only activate if it hasn't been cancelled or modified
        if ($this->auction->status === \App\Enums\AuctionStatus::Scheduled) {
            $auctionService->activate($this->auction);
        }
    }
}
