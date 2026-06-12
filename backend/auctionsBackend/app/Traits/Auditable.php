<?php

namespace App\Traits;

use App\Contracts\Admin\IAuditService;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;

trait Auditable
{
    protected static function bootAuditable()
    {
        static::created(function (Model $model) {
            self::logAudit('created', $model);
        });

        static::updated(function (Model $model) {
            self::logAudit('updated', $model);
        });

        static::deleted(function (Model $model) {
            self::logAudit('deleted', $model);
        });
    }

    protected static function logAudit(string $action, Model $model)
    {
        try {
            $auditService = App::make(IAuditService::class);
            
            $oldValues = [];
            $newValues = [];

            if ($action === 'updated') {
                $dirty = $model->getDirty();
                foreach ($dirty as $key => $value) {
                    $oldValues[$key] = $model->getOriginal($key);
                    $newValues[$key] = $value;
                }
            } elseif ($action === 'created') {
                $newValues = $model->getAttributes();
            } elseif ($action === 'deleted') {
                $oldValues = $model->getAttributes();
            }

            $auditService->log("{$model->getTable()}.{$action}", $model, [
                'old' => $oldValues,
                'new' => $newValues,
            ]);
        } catch (\Exception $e) {
            // Failsafe to prevent audit logging from breaking main transaction
            \Illuminate\Support\Facades\Log::error('Audit logging failed: ' . $e->getMessage());
        }
    }
}
