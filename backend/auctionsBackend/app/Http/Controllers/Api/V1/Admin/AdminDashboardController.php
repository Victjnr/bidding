<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function stats(): JsonResponse
    {
        // Simple mock for dashboard stats that an admin would see
        return ApiResponse::success([
            'total_users' => \App\Models\User::count(),
            'total_auctions' => \App\Models\Auction::count(),
            'total_gmv' => \App\Models\Transaction::where('status', 'completed')->sum('gross_amount'),
        ]);
    }

    public function revenueChart(): JsonResponse
    {
        // Return basic revenue chart data
        return ApiResponse::success([
            // In reality, this would query transactions and group by date
            ['date' => '2023-10-01', 'gmv' => 1500, 'commission' => 150],
            ['date' => '2023-10-02', 'gmv' => 2000, 'commission' => 200],
        ]);
    }

    public function userGrowth(): JsonResponse
    {
        // Return basic user growth data
        return ApiResponse::success([
            ['date' => '2023-10-01', 'new_users' => 10],
            ['date' => '2023-10-02', 'new_users' => 15],
        ]);
    }
}
