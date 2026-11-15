<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Contracts\Admin\ISettingsService;
use App\Models\PlatformSetting;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class SettingsService implements ISettingsService
{
    public function __construct(
        protected readonly IAuditService $auditService
    ) {}

    public function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("setting:{$key}", 600, function () use ($key, $default) {
            $setting = PlatformSetting::where('key', $key)->first();
            return $setting ? $setting->value : $default;
        });
    }

    public function set(string $key, mixed $value, User $actor): void
    {
        $oldValue = $this->get($key);

        PlatformSetting::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );

        Cache::forget("setting:{$key}");

        $this->auditService->log("setting.updated", null, [
            'old' => ['key' => $key, 'value' => $oldValue],
            'new' => ['key' => $key, 'value' => $value],
        ], $actor);
    }
}
