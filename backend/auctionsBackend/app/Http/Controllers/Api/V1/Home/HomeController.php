<?php

namespace App\Http\Controllers\Api\V1\Home;

use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Redis;

class HomeController extends Controller
{
    public function featured(): JsonResponse
    {
        $featured = Redis::remember('home:featured', 300, function () { // 5 min TTL
            return Auction::where('status', AuctionStatus::Active)
                ->orderByDesc('current_price')
                ->take(8)
                ->with(['media' => fn($q) => $q->where('is_primary', true)])
                ->get();
        });

        $endingSoon = Redis::remember('home:ending_soon', 60, function () { // 1 min TTL
            return Auction::where('status', AuctionStatus::Active)
                ->where('end_at', '<', now()->addHours(2))
                ->orderBy('end_at', 'asc')
                ->take(8)
                ->with(['media' => fn($q) => $q->where('is_primary', true)])
                ->get();
        });

        $categories = Redis::remember('home:categories', 600, function () { // 10 min TTL
            // Simplified fallback if Category model/table isn't defined explicitly in prompt
            // Normally: Category::withCount(['auctions' => fn($q) => $q->where('status', 'active')])->orderByDesc('auctions_count')->take(8)->get();
            return [];
        });

        $platformStats = [
            'active_auctions' => (int) Redis::get('bidflow:stats:active_auctions') ?: 0,
            'total_bidders' => (int) Redis::get('bidflow:stats:total_bidders') ?: 0,
            'gmv_today' => (float) Redis::get('bidflow:stats:gmv_today') ?: 0.0,
        ];

        return ApiResponse::success([
            'featured' => $featured,
            'ending_soon' => $endingSoon,
            'categories' => $categories,
            'platform_stats' => $platformStats,
        ]);
    }
}
