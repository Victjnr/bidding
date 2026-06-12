<?php

namespace App\Services\Analytics;

use App\Contracts\Analytics\ISellerAnalyticsService;
use App\DTOs\Analytics\SellerStatsDTO;
use App\Enums\AuctionStatus;
use App\Enums\TransactionStatus;
use App\Models\Auction;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Carbon\Carbon;

class SellerAnalyticsService implements ISellerAnalyticsService
{
    public function getDashboardStats(User $seller): SellerStatsDTO
    {
        return Redis::remember("seller:stats:{$seller->id}", 300, function () use ($seller) {
            
            // Read replica usage via ->on('mysql_read') or DB::connection('mysql_read')
            // Using ->on() for Eloquent, assuming the connection 'mysql_read' is defined in config/database.php
            // If not strictly defined, we can fallback or use DB connection block. 
            // We'll wrap in try-catch in case 'mysql_read' isn't setup in their environment yet.
            
            $connection = config()->has('database.connections.mysql_read') ? 'mysql_read' : config('database.default');

            $activeListings = Auction::on($connection)
                ->where('seller_id', $seller->id)
                ->where('status', AuctionStatus::Active)
                ->count();

            // Total bids today on seller's auctions
            $totalBidsToday = DB::connection($connection)->table('bids')
                ->join('auctions', 'bids.auction_id', '=', 'auctions.id')
                ->where('auctions.seller_id', $seller->id)
                ->whereDate('bids.created_at', Carbon::today())
                ->count();

            // GMV this month
            $gmvThisMonth = Transaction::on($connection)
                ->where('seller_id', $seller->id)
                ->where('status', TransactionStatus::Completed)
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('gross_amount');

            // Pending payouts (completed transaction, but escrow not released)
            $pendingPayouts = Transaction::on($connection)
                ->where('seller_id', $seller->id)
                ->where('status', TransactionStatus::Completed)
                ->whereNull('escrow_released_at')
                ->sum('net_amount');

            return new SellerStatsDTO(
                activeListings: $activeListings,
                totalBidsToday: $totalBidsToday,
                gmvThisMonth: (float) $gmvThisMonth,
                pendingPayouts: (float) $pendingPayouts,
            );
        });
    }

    public function getRevenueChart(User $seller, string $period): array
    {
        $connection = config()->has('database.connections.mysql_read') ? 'mysql_read' : config('database.default');

        $startDate = match ($period) {
            '7d' => Carbon::now()->subDays(7),
            '30d' => Carbon::now()->subDays(30),
            '90d' => Carbon::now()->subDays(90),
            default => Carbon::now()->subDays(30),
        };

        $results = DB::connection($connection)
            ->table('transactions')
            ->selectRaw('DATE(created_at) as date, SUM(gross_amount) as gmv, SUM(fee_amount) as commission')
            ->where('seller_id', $seller->id)
            ->where('status', TransactionStatus::Completed->value)
            ->where('created_at', '>=', $startDate)
            ->groupBy(DB::raw('DATE(created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        return $results->toArray();
    }

    public function getListingPerformance(User $seller): array
    {
        $connection = config()->has('database.connections.mysql_read') ? 'mysql_read' : config('database.default');

        return DB::connection($connection)
            ->table('auctions')
            ->select('id', 'title', 'current_price', 'end_at')
            ->selectRaw('(SELECT COUNT(*) FROM bids WHERE bids.auction_id = auctions.id) as bids_count')
            ->where('seller_id', $seller->id)
            ->where('status', AuctionStatus::Active->value)
            ->orderByDesc('bids_count')
            ->take(10)
            ->get()
            ->toArray();
    }
}
