<?php

namespace App\Http\Controllers\Api\V1\Home;

use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Auction\AuctionResource;
use App\Http\Resources\CategoryResource;
use App\Models\Auction;
use App\Models\Category;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class HomeController extends Controller
{
    public function featured(): JsonResponse
    {
        $featuredModels = Cache::remember('home:featured', 60, function () {
            return Auction::where('status', AuctionStatus::Active)
                ->orderByDesc('current_price')
                ->take(8)
                ->with(['seller', 'category', 'media'])
                ->get();
        });

        $endingSoonModels = Cache::remember('home:ending_soon', 60, function () {
            return Auction::where('status', AuctionStatus::Active)
                ->where('end_at', '>', now())
                ->orderBy('end_at', 'asc')
                ->take(8)
                ->with(['seller', 'category', 'media'])
                ->get();
        });

        $categoryModels = Cache::remember('home:categories', 300, function () {
            return Category::withCount(['auctions' => fn($q) => $q->where('status', 'active')])
                ->orderBy('sort_order')
                ->take(8)
                ->get();
        });

        $featured = AuctionResource::collection($featuredModels)->resolve();
        $endingSoon = AuctionResource::collection($endingSoonModels)->resolve();
        $categories = CategoryResource::collection($categoryModels)->resolve();

        $activeCount = Auction::where('status', AuctionStatus::Active)->count();
        $totalBidders = User::count();
        $gmvToday = (float) \App\Models\Bid::whereDate('created_at', today())->sum('amount');

        $platformStats = [
            'active_auctions' => $activeCount,
            'activeAuctions' => $activeCount,
            'total_bidders' => $totalBidders,
            'totalBidders' => $totalBidders,
            'gmv_today' => $gmvToday,
            'gmvToday' => $gmvToday,
        ];

        return ApiResponse::success([
            'featured' => $featured,
            'ending_soon' => $endingSoon,
            'endingSoon' => $endingSoon,
            'categories' => $categories,
            'platform_stats' => $platformStats,
            'platformStats' => $platformStats,
        ]);
    }
}
