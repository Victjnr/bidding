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
        $registeredBidders = User::role('bidder')->count();
        
        // Ensure registered bidders falls back to user count if role doesn't exist or isn't assigned yet
        if ($registeredBidders === 0) {
            $registeredBidders = User::count();
        }

        $bidsToday = Bid::whereDate('created_at', Carbon::today())->sum('amount');

        return response()->json([
            'data' => [
                'active_auctions' => $activeAuctions,
                'registered_bidders' => $registeredBidders,
                'bids_today' => $bidsToday ?: 0,
            ]
        ]);
    }
}
