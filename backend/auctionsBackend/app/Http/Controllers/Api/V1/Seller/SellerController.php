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
        $user = auth()->user();
        $stats = $this->analyticsService->getDashboardStats($user);
        $activeListings = (int) ($stats['active_listings'] ?? 0);
        $totalRevenue = (float) ($stats['total_revenue'] ?? 0);
        $pendingPayouts = (float) ($stats['pending_payouts'] ?? 0);
        $avgBids = (float) ($stats['avg_bids_per_listing'] ?? 0);

        $sellerAuctionIds = Auction::where('seller_id', $user->id)->pluck('id');
        $watchlistAdds = $sellerAuctionIds->isEmpty()
            ? 0
            : (int) \Illuminate\Support\Facades\DB::table('auction_watches')->whereIn('auction_id', $sellerAuctionIds)->count();
        $totalBidsOnSeller = $sellerAuctionIds->isEmpty()
            ? 0
            : (int) \App\Models\Bid::whereIn('auction_id', $sellerAuctionIds)->count();

        $totalClosed = Auction::where('seller_id', $user->id)
            ->whereIn('status', [\App\Enums\AuctionStatus::Sold->value, \App\Enums\AuctionStatus::NoSale->value, \App\Enums\AuctionStatus::Ended->value])
            ->count();
        $totalSold = Auction::where('seller_id', $user->id)
            ->where('status', \App\Enums\AuctionStatus::Sold->value)
            ->count();
        $conversionRate = $totalClosed > 0 ? round(($totalSold / $totalClosed) * 100, 1) : 0.0;

        $thisMonthRev = (float) Transaction::where('seller_id', $user->id)
            ->where('created_at', '>=', now()->subDays(30))
            ->sum('seller_payout');
        $prevMonthRev = (float) Transaction::where('seller_id', $user->id)
            ->whereBetween('created_at', [now()->subDays(60), now()->subDays(30)])
            ->sum('seller_payout');
        $revenueChange = $prevMonthRev > 0
            ? round((($thisMonthRev - $prevMonthRev) / $prevMonthRev) * 100, 1)
            : ($thisMonthRev > 0 ? 100.0 : 0.0);

        return ApiResponse::success([
            'active_listings' => $activeListings,
            'activeListings' => $activeListings,
            'total_revenue' => $totalRevenue,
            'totalRevenue' => $totalRevenue,
            'revenueChange' => $revenueChange,
            'pending_payouts' => $pendingPayouts,
            'pendingPayouts' => $pendingPayouts,
            'avg_bids_per_listing' => $avgBids,
            'avgBidsPerListing' => $avgBids,
            'totalViews' => $totalBidsOnSeller + $watchlistAdds,
            'conversionRate' => $conversionRate,
            'watchlistAdds' => $watchlistAdds,
        ]);
    }

    public function revenueChart(PeriodRequest $request): JsonResponse
    {
        $period = $request->input('period', '30d');
        $chart = $this->analyticsService->getRevenueChart(auth()->user(), $period);

        $formatted = collect($chart)->map(function ($row) {
            $gmv = (float) ($row['gmv'] ?? $row->gmv ?? 0);
            $fees = round($gmv * 0.05, 2);
            return [
                'date' => $row['date'] ?? $row->date ?? now()->toDateString(),
                'gmv' => $gmv,
                'revenue' => $gmv,
                'fees' => $fees,
                'net' => round($gmv - $fees, 2),
            ];
        })->all();

        return ApiResponse::success($formatted);
    }

    public function listingPerformance(): JsonResponse
    {
        $user = auth()->user();
        $performance = $this->analyticsService->getListingPerformance($user);
        $sellerAuctionIds = Auction::where('seller_id', $user->id)->pluck('id');

        $topListings = Auction::where('seller_id', $user->id)
            ->withCount('watchers')
            ->orderByDesc('total_bids')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'uuid' => $a->uuid,
                'title' => $a->title,
                'views' => (int) $a->total_bids + (int) ($a->watchers_count ?? 0),
                'bids' => (int) $a->total_bids,
                'finalPrice' => (float) $a->current_price,
                'status' => $a->status?->value ?? (string) $a->status,
            ])->all();

        $avgBidsToSell = (float) (Auction::where('seller_id', $user->id)
            ->where('status', \App\Enums\AuctionStatus::Sold->value)
            ->avg('total_bids') ?? 0.0);

        $viewsByDay = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $dayBids = $sellerAuctionIds->isEmpty()
                ? 0
                : \App\Models\Bid::whereIn('auction_id', $sellerAuctionIds)->whereDate('created_at', $date)->count();
            $dayUnique = $sellerAuctionIds->isEmpty()
                ? 0
                : \App\Models\Bid::whereIn('auction_id', $sellerAuctionIds)->whereDate('created_at', $date)->distinct('user_id')->count('user_id');
            $viewsByDay[] = [
                'date' => $date,
                'views' => (int) $dayBids,
                'uniqueVisitors' => (int) $dayUnique,
            ];
        }

        $categoryBreakdown = Auction::where('seller_id', $user->id)
            ->with('category:id,name')
            ->get()
            ->groupBy(fn ($a) => $a->category?->name ?? 'Uncategorized')
            ->map(fn ($items, $catName) => [
                'category' => $catName,
                'count' => $items->count(),
                'revenue' => (float) $items->where('status', \App\Enums\AuctionStatus::Sold)->sum('current_price'),
            ])
            ->values()
            ->all();

        $sellThrough = (float) ($performance['sell_through_rate'] ?? 0.0);

        return ApiResponse::success([
            'conversionRate' => $sellThrough,
            'sell_through_rate' => $sellThrough,
            'sellThroughRate' => $sellThrough,
            'avgBidsToSell' => round($avgBidsToSell, 1),
            'avgSalePrice' => (float) (Auction::where('seller_id', $user->id)->avg('current_price') ?? 0),
            'avg_final_vs_start_price_ratio' => (float) ($performance['avg_final_vs_start_price_ratio'] ?? 1.0),
            'viewsByDay' => $viewsByDay,
            'topListings' => $topListings,
            'categoryBreakdown' => $categoryBreakdown,
        ]);
    }

    public function myListings(\Illuminate\Http\Request $request): JsonResponse
    {
        $query = Auction::where('seller_id', auth()->id())->with(['seller', 'category', 'media']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('title', 'like', "%{$search}%");
        }

        if ($request->input('sort') === 'price_desc') {
            $query->orderByDesc('current_price');
        } else {
            $query->latest();
        }

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $listings = $query->paginate($perPage);

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

    public function bulkAction(\Illuminate\Http\Request $request): JsonResponse
    {
        $uuids = (array) ($request->input('uuids') ?? $request->input('auctionUuids', []));
        $action = $request->input('action');

        $auctions = Auction::where('seller_id', auth()->id())->whereIn('uuid', $uuids)->get();
        foreach ($auctions as $auction) {
            if ($action === 'delete') {
                $auction->delete();
            } elseif ($action === 'cancel') {
                $auction->update(['status' => \App\Enums\AuctionStatus::Cancelled->value]);
            } elseif ($action === 'relist') {
                $auction->update([
                    'status' => \App\Enums\AuctionStatus::Active->value,
                    'start_at' => now(),
                    'end_at' => now()->addDays(7),
                ]);
            }
        }

        return ApiResponse::success(null, 'Bulk action completed');
    }

    public function payoutHistory(\Illuminate\Http\Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $payouts = Transaction::where('seller_id', auth()->id())
            ->with('auction:id,uuid,title')
            ->latest()
            ->paginate($perPage);

        $formatted = collect($payouts->items())->map(fn ($tx) => [
            'id' => $tx->id,
            'uuid' => $tx->uuid,
            'amount' => (float) $tx->gross_amount,
            'fee' => (float) $tx->platform_fee,
            'netAmount' => (float) $tx->seller_payout,
            'currency' => $tx->currency ?? 'USD',
            'status' => $tx->escrow_released_at ? 'completed' : 'pending',
            'method' => 'Wallet / Bank Payout',
            'auctionTitle' => $tx->auction?->title ?? 'Auction Settlement',
            'auctionUuid' => $tx->auction?->uuid ?? '',
            'paidAt' => $tx->escrow_released_at?->toIso8601String(),
            'createdAt' => $tx->created_at?->toIso8601String(),
        ])->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ]
        );
    }
}
