<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Storage;

class HealthController extends Controller
{
    public function check()
    {
        $status = [
            'status' => 'ok',
            'checks' => [
                'database' => 'ok',
                'redis' => 'ok',
                'storage' => 'ok',
            ]
        ];
        $statusCode = 200;

        try {
            DB::connection()->getPdo();
        } catch (\Exception $e) {
            $status['status'] = 'error';
            $status['checks']['database'] = 'failed';
            $statusCode = 503;
            Log::error('Healthcheck DB failed: ' . $e->getMessage());
        }

        try {
            Redis::ping();
        } catch (\Exception $e) {
            $status['status'] = 'error';
            $status['checks']['redis'] = 'failed';
            $statusCode = 503;
            Log::error('Healthcheck Redis failed: ' . $e->getMessage());
        }

        try {
            Storage::disk('local')->exists('healthcheck_test'); // simple local storage check
        } catch (\Exception $e) {
            $status['status'] = 'error';
            $status['checks']['storage'] = 'failed';
            $statusCode = 503;
            Log::error('Healthcheck Storage failed: ' . $e->getMessage());
        }

        return ApiResponse::success($status, 'System Status', $statusCode);
    }
}
