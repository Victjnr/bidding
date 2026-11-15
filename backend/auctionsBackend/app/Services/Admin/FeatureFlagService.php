<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Contracts\Admin\IFeatureFlagService;
use App\Models\FeatureFlag;
use App\Models\User;
use Illuminate\Support\Facades\Cache;

class FeatureFlagService implements IFeatureFlagService
{
    public function __construct(
        protected readonly IAuditService $auditService
    ) {}

    public function isEnabled(string $flag, ?User $user = null): bool
    {
        $config = Cache::remember("feature:{$flag}", 60, function () use ($flag) {
            return FeatureFlag::where('name', $flag)->first()?->toArray();
        });

        if (!$config || !$config['is_enabled']) {
            return false;
        }

        if ($user && !empty($config['allowlist'])) {
            if (in_array($user->id, $config['allowlist'])) {
                return true;
            }
        }

        if ($user && isset($config['rollout_percentage']) && $config['rollout_percentage'] > 0) {
            $hash = crc32($user->id . $flag);
            $bucket = $hash % 100;
            return $bucket < $config['rollout_percentage'];
        }

        return (!isset($config['rollout_percentage']) || $config['rollout_percentage'] == 100);
    }

    public function toggle(string $flag, User $actor): void
    {
        $feature = FeatureFlag::firstOrCreate(['name' => $flag]);
        $oldState = $feature->is_enabled;
        $feature->is_enabled = !$oldState;
        $feature->save();

        Cache::forget("feature:{$flag}");

        $this->auditService->log("feature_flag.toggled", $feature, [
            'old' => ['is_enabled' => $oldState],
            'new' => ['is_enabled' => $feature->is_enabled],
        ], $actor);
    }
}
