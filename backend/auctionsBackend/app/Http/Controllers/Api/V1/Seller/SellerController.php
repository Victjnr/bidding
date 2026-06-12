<?php

namespace App\Http\Controllers\Api\V1\Seller;

use App\Contracts\Analytics\ISellerAnalyticsService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\ListingFilterRequest;
use App\Http\Requests\Seller\PeriodRequest;
use App\Models\Auction;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;

class SellerController extends Controller
{
    public function __construct(
        protected readonly ISellerAnalyticsService $analyticsService
    ) {}

    public function dashboardStats(): JsonResponse
    {
        $stats = $this->analyticsService->getDashboardStats(auth()->user());
        return ApiResponse::success($stats);
    }

    public function revenueChart(PeriodRequest $request): JsonResponse
    {
        $period = $request->input('period', '30d');
        $chart = $this->analyticsService->getRevenueChart(auth()->user(), $period);
        
        return ApiResponse::success($chart);
    }

    public function listingPerformance(): JsonResponse
    {
        $performance = $this->analyticsService->getListingPerformance(auth()->user());
        return ApiResponse::success($performance);
    }

    public function myListings(ListingFilterRequest $request): JsonResponse
    {
        $query = Auction::where('seller_id', auth()->id());
        
        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('sort')) {
            // Simplified sorting
            if ($request->input('sort') === 'price_desc') {
                $query->orderByDesc('current_price');
            } else {
                $query->latest();
            }
        } else {
            $query->latest();
        }

        $listings = $query->paginate($request->input('per_page', 20));

        return ApiResponse::success($listings);
    }

    public function payoutHistory(): JsonResponse
    {
        $payouts = Transaction::where('seller_id', auth()->id())
            ->whereNotNull('escrow_released_at')
            ->orderByDesc('escrow_released_at')
            ->paginate(20);

        return ApiResponse::success($payouts);
    }
}
