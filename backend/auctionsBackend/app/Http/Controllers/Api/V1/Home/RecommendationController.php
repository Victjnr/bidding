<?php

namespace App\Http\Controllers\Api\V1\Home;

use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $recsKey = "bidflow:user:{$userId}:recommendations";
        $recIds = Redis::get($recsKey);

        if ($recIds) {
            $uuids = json_decode($recIds, true) ?? [];
            if (!empty($uuids)) {
                $recommendations = Auction::whereIn('uuid', $uuids)
                    ->where('status', AuctionStatus::Active)
                    ->with(['media' => fn($q) => $q->where('is_primary', true), 'seller:id,first_name,last_name'])
                    ->get();
                
                return ApiResponse::success($recommendations);
            }
        }

        // Fallback: popular auctions (e.g., most bids, simplified to highest price/recent for demo if bids count not readily queryable)
        // In a real scenario, this is cached or driven by a specific flag.
        $fallback = Auction::where('status', AuctionStatus::Active)
            ->withCount('bids')
            ->orderByDesc('bids_count')
            ->take(8)
            ->with(['media' => fn($q) => $q->where('is_primary', true), 'seller:id,first_name,last_name'])
            ->get();

        return ApiResponse::success($fallback);
    }
}
