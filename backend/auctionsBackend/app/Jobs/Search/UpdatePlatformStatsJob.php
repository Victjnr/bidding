<?php

namespace App\Jobs\Search;

use App\Enums\AuctionStatus;
use App\Models\Auction;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class UpdatePlatformStatsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $activeAuctions = Auction::where('status', AuctionStatus::Active)->count();
        $totalBidders = User::whereHas('bids')->count(); // Users who have placed at least one bid
        
        // GMV Today (Gross Merchandise Value of completed/sold auctions today)
        // Usually calculated by summing final prices of sold items today.
        $gmvToday = Auction::whereIn('status', [AuctionStatus::Sold])
            ->whereDate('end_at', today())
            ->sum('current_price');

        Redis::set('bidflow:stats:active_auctions', $activeAuctions);
        Redis::set('bidflow:stats:total_bidders', $totalBidders);
        Redis::set('bidflow:stats:gmv_today', (float)$gmvToday);
    }
}
