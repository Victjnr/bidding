<?php

namespace App\Contracts\Analytics;

use App\DTOs\Analytics\SellerStatsDTO;
use App\Models\User;

interface ISellerAnalyticsService
{
    public function getDashboardStats(User $seller): SellerStatsDTO;
    public function getRevenueChart(User $seller, string $period): array;
    public function getListingPerformance(User $seller): array;
}
