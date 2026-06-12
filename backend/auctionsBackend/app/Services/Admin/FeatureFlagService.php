<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Contracts\Admin\IFeatureFlagService;
use App\Models\FeatureFlag;
use App\Models\User;
use Illuminate\Support\Facades\Redis;

class FeatureFlagService implements IFeatureFlagService
{
    public function __construct(
        protected readonly IAuditService $auditService
    ) {}

    public function isEnabled(string $flag, ?User $user = null): bool
    {
        $config = Redis::remember("feature:{$flag}", 60, function () use ($flag) {
            return FeatureFlag::where('name', $flag)->first()?->toArray();
        });

        if (!$config || !$config['is_enabled']) {
            return false;
        }

        // If allowlist exists and user is in it, allow.
        if ($user && !empty($config['allowlist'])) {
            if (in_array($user->id, $config['allowlist'])) {
                return true;
            }
        }

        // Canary rollout based on crc32 hash
        if ($user && isset($config['rollout_percentage']) && $config['rollout_percentage'] > 0) {
            $hash = crc32($user->id . $flag);
            $bucket = $hash % 100;
            return $bucket < $config['rollout_percentage'];
        }

        // If no rollout percentage or user is null, fallback to purely boolean
        // Meaning 100% rollout or just toggled globally
        return (!isset($config['rollout_percentage']) || $config['rollout_percentage'] == 100);
    }

    public function toggle(string $flag, User $actor): void
    {
        $feature = FeatureFlag::firstOrCreate(['name' => $flag]);
        $oldState = $feature->is_enabled;
        $feature->is_enabled = !$oldState;
        $feature->save();

        Redis::del("feature:{$flag}");

        $this->auditService->log("feature_flag.toggled", $feature, [
            'old' => ['is_enabled' => $oldState],
            'new' => ['is_enabled' => $feature->is_enabled],
        ], $actor);
    }
}
