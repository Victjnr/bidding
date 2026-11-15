<?php

namespace App\Http\Controllers\Api\V1\Home;

use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Auction\AuctionResource;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class RecommendationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()?->id;
        if ($userId) {
            $recsKey = "bidflow:user:{$userId}:recommendations";
            $recIds = Cache::get($recsKey);

            if ($recIds) {
                $uuids = is_string($recIds) ? (json_decode($recIds, true) ?? []) : (array) $recIds;
                if (!empty($uuids)) {
                    $recommendations = Auction::whereIn('uuid', $uuids)
                        ->where('status', AuctionStatus::Active)
                        ->with(['media', 'seller', 'category'])
                        ->get();

                    return ApiResponse::success(AuctionResource::collection($recommendations)->resolve());
                }
            }
        }

        $fallback = Auction::where('status', AuctionStatus::Active)
            ->orderByDesc('total_bids')
            ->take(8)
            ->with(['media', 'seller', 'category'])
            ->get();

        return ApiResponse::success(AuctionResource::collection($fallback)->resolve());
    }
}
