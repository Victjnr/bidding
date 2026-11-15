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
        $query = AuditLog::with(['actor:id,uuid,first_name,last_name,display_name,email']);

        if ($request->filled('action')) {
            $action = $request->input('action');
            $query->where('action', 'like', "%{$action}%");
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                    ->orWhere('subject_type', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%")
                    ->orWhereHas('actor', function ($aq) use ($search) {
                        $aq->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('actor_id')) {
            $query->where('actor_id', $request->input('actor_id'));
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->input('subject_type'));
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->input('end_date') . ' 23:59:59');
        }

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 50);
        $logs = $query->latest('created_at')->paginate($perPage);

        $formatted = collect($logs->items())->map(function (AuditLog $log) {
            $actor = $log->actor;
            $actorName = $actor
                ? ($actor->display_name ?: trim($actor->first_name . ' ' . $actor->last_name) ?: $actor->email)
                : 'System';
            $actorUuid = $actor?->uuid ?: 'system00-0000-0000-0000-000000000000';
            $timestamp = $log->created_at?->toIso8601String() ?? now()->toIso8601String();

            return [
                'id' => $log->id,
                'timestamp' => $timestamp,
                'createdAt' => $timestamp,
                'created_at' => $timestamp,
                'actorName' => $actorName,
                'actorUuid' => $actorUuid,
                'adminId' => (string) ($log->actor_id ?? ''),
                'adminName' => $actorName,
                'actor' => $actor,
                'action' => $log->action,
                'subjectType' => $log->subject_type ? class_basename((string) $log->subject_type) : 'Platform',
                'subjectId' => (string) ($log->subject_id ?? '-'),
                'targetType' => $log->subject_type ? class_basename((string) $log->subject_type) : 'Platform',
                'targetId' => (string) ($log->subject_id ?? '-'),
                'subject_type' => $log->subject_type,
                'subject_id' => $log->subject_id,
                'oldValues' => is_array($log->old_values) ? $log->old_values : null,
                'newValues' => is_array($log->new_values) ? $log->new_values : null,
                'details' => [
                    'old' => $log->old_values,
                    'new' => $log->new_values,
                ],
                'ip' => $log->ip_address ?? '127.0.0.1',
                'ip_address' => $log->ip_address ?? '127.0.0.1',
            ];
        })->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ]
        );
    }
}
