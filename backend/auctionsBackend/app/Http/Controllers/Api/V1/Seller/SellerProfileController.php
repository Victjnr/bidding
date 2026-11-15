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
        $displayName = $seller->display_name ?: trim($seller->first_name . ' ' . $seller->last_name) ?: 'Seller';
        $totalSales = $seller->auctions()->whereIn('status', [AuctionStatus::Closed, AuctionStatus::Settled])->count();

        $publicProfile = [
            'uuid' => $seller->uuid,
            'displayName' => $displayName,
            'firstName' => $seller->first_name,
            'lastName' => $seller->last_name,
            'first_name' => $seller->first_name,
            'last_name' => $seller->last_name,
            'avatarUrl' => $seller->avatar_path,
            'avatar_url' => $seller->avatar_path,
            'bio' => $seller->bio,
            'rating' => 4.9,
            'reviewCount' => max(1, $totalSales),
            'totalSales' => $totalSales,
            'responseRate' => 98,
            'memberSince' => $seller->created_at?->toIso8601String(),
            'joined_at' => $seller->created_at?->toIso8601String(),
            'isVerified' => $seller->getNumericKycTier() >= 1,
        ];

        return ApiResponse::success($publicProfile);
    }

    public function listings(\Illuminate\Http\Request $request, string $uuid): JsonResponse
    {
        $seller = User::where('uuid', $uuid)->firstOrFail();

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $listings = $seller->auctions()
            ->where('status', AuctionStatus::Active)
            ->with(['seller', 'category', 'media'])
            ->latest()
            ->paginate($perPage);

        return ApiResponse::paginated(
            \App\Http\Resources\Auction\AuctionResource::collection($listings->items())->resolve(),
            [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'per_page' => $listings->perPage(),
                'total' => $listings->total(),
            ]
        );
    }
}
