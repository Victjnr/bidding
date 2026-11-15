<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Dispute;
use App\Models\KycDocument;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        $totalUsers = User::count();
        $totalAuctions = Auction::count();
        $activeAuctions = Auction::whereIn('status', ['active', 'extended', 'closing'])->count();
        $pendingAuctions = Auction::whereIn('status', ['pending', 'draft'])->count();
        $pendingKyc = KycDocument::where('status', 'pending')->count();
        $openDisputes = Dispute::where('status', 'open')->count();
        $bidsToday = Bid::whereDate('created_at', today())->count();

        $liveBidders = Bid::whereHas('auction', fn ($q) => $q->whereIn('status', ['active', 'extended', 'closing']))
            ->distinct('bidder_id')
            ->count('bidder_id');

        $bidsLastHour = Bid::where('created_at', '>=', now()->subHour())->count();
        $bidsPrevHour = Bid::whereBetween('created_at', [now()->subHours(2), now()->subHour()])->count();
        $bidsPerMinute = $bidsLastHour > 0 ? max(1, (int) ceil($bidsLastHour / 60)) : 0;

        $txGmv = (float) Transaction::sum('gross_amount');
        $soldGmv = (float) Auction::whereIn('status', ['sold', 'ended'])->sum('current_price');
        $totalGmv = $txGmv > 0 ? $txGmv : $soldGmv;

        $txFees = (float) Transaction::sum('platform_fee');
        $platformRevenue = $txFees > 0 ? $txFees : round($totalGmv * 0.05, 2);

        $auctionsLast7d = Auction::where('created_at', '>=', now()->subDays(7))->count();
        $auctionsPrev7d = Auction::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])->count();
        $activeAuctionsTrend = $this->calcTrend($auctionsLast7d, $auctionsPrev7d);

        $biddersLast7d = Bid::where('created_at', '>=', now()->subDays(7))->distinct('bidder_id')->count('bidder_id');
        $biddersPrev7d = Bid::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])->distinct('bidder_id')->count('bidder_id');
        $liveBiddersTrend = $this->calcTrend($biddersLast7d, $biddersPrev7d);

        $bidsPerMinuteTrend = $this->calcTrend($bidsLastHour, $bidsPrevHour);

        $kycLast7d = KycDocument::where('created_at', '>=', now()->subDays(7))->count();
        $kycPrev7d = KycDocument::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])->count();
        $pendingKycTrend = $this->calcTrend($kycLast7d, $kycPrev7d);

        $disputesLast7d = Dispute::where('created_at', '>=', now()->subDays(7))->count();
        $disputesPrev7d = Dispute::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])->count();
        $openDisputesTrend = $this->calcTrend($disputesLast7d, $disputesPrev7d);

        $usersLast7d = User::where('created_at', '>=', now()->subDays(7))->count();
        $usersPrev7d = User::whereBetween('created_at', [now()->subDays(14), now()->subDays(7)])->count();
        $usersChange = $this->calcTrend($usersLast7d, $usersPrev7d);

        return ApiResponse::success([
            'total_users' => $totalUsers,
            'totalUsers' => $totalUsers,
            'usersChange' => $usersChange,
            'total_auctions' => $totalAuctions,
            'totalAuctions' => $totalAuctions,
            'activeAuctions' => $activeAuctions,
            'activeAuctionsTrend' => $activeAuctionsTrend,
            'auctionsChange' => $activeAuctionsTrend,
            'liveBidders' => $liveBidders,
            'liveBiddersTrend' => $liveBiddersTrend,
            'bidsPerMinute' => $bidsPerMinute,
            'bidsPerMinuteTrend' => $bidsPerMinuteTrend,
            'total_gmv' => $totalGmv,
            'gmv' => $totalGmv,
            'gmvChange' => $activeAuctionsTrend,
            'platformRevenue' => $platformRevenue,
            'revenueChange' => $activeAuctionsTrend,
            'pendingKyc' => $pendingKyc,
            'pendingKycTrend' => $pendingKycTrend,
            'pendingAuctions' => $pendingAuctions,
            'openDisputes' => $openDisputes,
            'openDisputesTrend' => $openDisputesTrend,
            'bidsToday' => $bidsToday,
        ]);
    }

    public function revenueChart(): JsonResponse
    {
        $days = 14;
        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();

            $dayTxGmv = (float) Transaction::whereDate('created_at', $date)->sum('gross_amount');
            $dayTxFees = (float) Transaction::whereDate('created_at', $date)->sum('platform_fee');
            $dayTxCount = Transaction::whereDate('created_at', $date)->count();

            if ($dayTxGmv <= 0) {
                $dayBidGmv = (float) Bid::whereDate('created_at', $date)->sum('amount');
                $dayTxGmv = $dayBidGmv;
                $dayTxFees = round($dayBidGmv * 0.05, 2);
                $dayTxCount = Auction::whereDate('updated_at', $date)->whereIn('status', ['sold', 'ended', 'active'])->count();
            }

            $series[] = [
                'date' => now()->subDays($i)->format('M d'),
                'rawDate' => $date,
                'gmv' => round($dayTxGmv, 2),
                'commission' => round($dayTxFees, 2),
                'revenue' => round($dayTxGmv, 2),
                'fees' => round($dayTxFees, 2),
                'auctionsSettled' => $dayTxCount,
            ];
        }

        return ApiResponse::success($series);
    }

    public function userGrowth(): JsonResponse
    {
        $days = 14;
        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $count = User::whereDate('created_at', $date)->count();
            $verified = User::whereDate('created_at', $date)->whereNotNull('email_verified_at')->count();

            $series[] = [
                'date' => now()->subDays($i)->format('M d'),
                'rawDate' => $date,
                'count' => $count,
                'new_users' => $count,
                'registrations' => $count,
                'verified' => $verified,
            ];
        }

        return ApiResponse::success($series);
    }

    private function calcTrend(int|float $current, int|float $previous): float
    {
        if ($previous <= 0) {
            return $current > 0 ? 100.0 : 0.0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }
}
