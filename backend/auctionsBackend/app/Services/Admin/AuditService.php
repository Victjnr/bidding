<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Jobs\Admin\AuditLogJob;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditService implements IAuditService
{
    public function log(string $action, ?Model $subject, array $changes, ?User $actor = null): void
    {
        $actorId = $actor ? $actor->id : (auth()->check() ? auth()->id() : null);
        
        $oldValues = $changes['old'] ?? [];
        $newValues = $changes['new'] ?? [];

        // In a real app we might need to filter hidden/secure fields (like passwords) before logging
        if (array_key_exists('password', $newValues)) {
            $newValues['password'] = '********';
        }

        $auditData = [
            'action' => $action,
            'subject_type' => $subject ? get_class($subject) : null,
            'subject_id' => $subject ? $subject->getKey() : null,
            'old_values' => empty($oldValues) ? null : $oldValues,
            'new_values' => empty($newValues) ? null : $newValues,
            'actor_id' => $actorId,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'created_at' => now(),
        ];

        AuditLogJob::dispatch($auditData);
    }
}
