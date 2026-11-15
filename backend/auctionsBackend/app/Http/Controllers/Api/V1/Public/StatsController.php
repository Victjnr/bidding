<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class StatsController extends Controller
{
    /**
     * Get statistics for the landing page.
     *
     * @return JsonResponse
     */
    public function landing(): JsonResponse
    {
        $activeAuctions = Auction::where('status', 'active')->count();
        try {
            $registeredBidders = User::role('bidder')->count();
        } catch (\Throwable) {
            $registeredBidders = 0;
        }

        if ($registeredBidders === 0) {
            $registeredBidders = User::count();
        }

        $bidsToday = (float) Bid::whereDate('created_at', Carbon::today())->sum('amount');

        return \App\Helpers\ApiResponse::success([
            'active_auctions' => $activeAuctions,
            'activeAuctions' => $activeAuctions,
            'registered_bidders' => $registeredBidders,
            'registeredBidders' => $registeredBidders,
            'bids_today' => $bidsToday ?: 0,
            'bidsToday' => $bidsToday ?: 0,
        ]);
    }
}
