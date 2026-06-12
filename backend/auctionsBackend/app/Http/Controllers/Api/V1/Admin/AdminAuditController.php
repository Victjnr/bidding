<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\AuditFilterRequest;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;

class AdminAuditController extends Controller
{
    public function index(AuditFilterRequest $request): JsonResponse
    {
        $query = AuditLog::with(['actor:id,first_name,last_name,email', 'subject']);

        if ($request->has('action')) {
            $query->where('action', $request->input('action'));
        }

        if ($request->has('actor_id')) {
            $query->where('actor_id', $request->input('actor_id'));
        }

        if ($request->has('subject_type')) {
            $query->where('subject_type', $request->input('subject_type'));
        }

        if ($request->has('start_date')) {
            $query->where('created_at', '>=', $request->input('start_date'));
        }

        if ($request->has('end_date')) {
            $query->where('created_at', '<=', $request->input('end_date') . ' 23:59:59');
        }

        $logs = $query->latest('created_at')->paginate($request->input('per_page', 50));

        return ApiResponse::success($logs);
    }
}
