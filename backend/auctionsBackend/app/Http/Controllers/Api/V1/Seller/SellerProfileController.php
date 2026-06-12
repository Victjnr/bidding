<?php

namespace App\Http\Controllers\Api\V1\Seller;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Enums\AuctionStatus;
use Illuminate\Http\JsonResponse;

class SellerProfileController extends Controller
{
    public function show(string $uuid): JsonResponse
    {
        $seller = User::where('uuid', $uuid)->firstOrFail();
        
        // Hide sensitive info for public profile
        $publicProfile = [
            'uuid' => $seller->uuid,
            'first_name' => $seller->first_name,
            'last_name' => $seller->last_name,
            'joined_at' => $seller->created_at,
            'avatar_url' => $seller->avatar_url ?? null,
            // Could add ratings/reviews here later
        ];

        return ApiResponse::success($publicProfile);
    }

    public function listings(string $uuid): JsonResponse
    {
        $seller = User::where('uuid', $uuid)->firstOrFail();

        $listings = $seller->auctions()
            ->where('status', AuctionStatus::Active)
            ->with(['media' => fn($q) => $q->where('is_primary', true)])
            ->latest()
            ->paginate(20);

        return ApiResponse::success($listings);
    }
}
