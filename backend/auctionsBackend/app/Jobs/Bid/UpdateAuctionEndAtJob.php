<?php

namespace App\Jobs\Bid;

use App\Models\Auction;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateAuctionEndAtJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public int $auctionId,
        public Carbon $newEndAt,
    ) {}

    public function handle(): void
    {
        Auction::where('id', $this->auctionId)->update([
            'end_at' => $this->newEndAt,
        ]);
    }
}
