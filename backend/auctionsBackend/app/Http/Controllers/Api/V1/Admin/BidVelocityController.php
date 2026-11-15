<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Bid;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BidVelocityController extends Controller
{
    /**
     * GET /api/v1/admin/bid-velocity
     * Returns real bid activity points over the last 12 hours/intervals.
     */
    public function index(Request $request): JsonResponse
    {
        $points = [];
        for ($i = 11; $i >= 0; $i--) {
            $start = now()->subHours($i + 1);
            $end = now()->subHours($i);
            $count = Bid::whereBetween('created_at', [$start, $end])->count();

            $points[] = [
                'timestamp' => $end->format('H:i'),
                'value' => $count,
            ];
        }

        return ApiResponse::success($points, 'Bid velocity retrieved');
    }
}
