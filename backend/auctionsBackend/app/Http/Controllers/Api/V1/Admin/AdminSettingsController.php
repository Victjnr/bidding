<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Admin\IFeatureFlagService;
use App\Contracts\Admin\ISettingsService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingsRequest;
use App\Models\AuditLog;
use App\Models\FeatureFlag;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminSettingsController extends Controller
{
    public function __construct(
        protected readonly ISettingsService $settingsService,
        protected readonly IFeatureFlagService $featureFlagService
    ) {}

    protected function getDefaultSettingsCatalog(): array
    {
        return [
            'general.platform_name' => [
                'label' => 'Platform Name',
                'description' => 'Public display name of the auction marketplace.',
                'group' => 'general',
                'type' => 'text',
                'default' => 'Upload Auctions',
            ],
            'general.support_email' => [
                'label' => 'Support Email',
                'description' => 'Primary contact address for buyer and seller inquiries.',
                'group' => 'general',
                'type' => 'text',
                'default' => 'support@uploadauctions.com',
            ],
            'general.default_currency' => [
                'label' => 'Default Currency',
                'description' => 'Default currency code for new auction listings.',
                'group' => 'general',
                'type' => 'select',
                'options' => ['USD', 'EUR', 'GBP', 'ZAR', 'ZWL'],
                'default' => 'USD',
            ],
            'bidding.anti_snipe_minutes' => [
                'label' => 'Anti-Snipe Window (Minutes)',
                'description' => 'Trigger window before auction close where late bids extend the timer.',
                'group' => 'bidding',
                'type' => 'number',
                'default' => 5,
            ],
            'bidding.anti_snipe_extend_minutes' => [
                'label' => 'Anti-Snipe Extension (Minutes)',
                'description' => 'Minutes added to auction timer when an anti-snipe bid is placed.',
                'group' => 'bidding',
                'type' => 'number',
                'default' => 5,
            ],
            'bidding.require_kyc_to_bid' => [
                'label' => 'Require Verified KYC to Bid',
                'description' => 'Enforce identity verification before allowing users to place bids.',
                'group' => 'bidding',
                'type' => 'toggle',
                'default' => false,
            ],
            'fees.platform_commission_percent' => [
                'label' => 'Platform Commission (%)',
                'description' => 'Percentage commission deducted from completed auction sales.',
                'group' => 'fees',
                'type' => 'number',
                'default' => 5,
            ],
            'fees.seller_payout_hold_days' => [
                'label' => 'Escrow Payout Hold (Days)',
                'description' => 'Number of days funds remain in escrow after delivery confirmation.',
                'group' => 'fees',
                'type' => 'number',
                'default' => 3,
            ],
            'security.require_admin_2fa' => [
                'label' => 'Require Admin 2FA',
                'description' => 'Mandate two-factor authentication for all administrator accounts.',
                'group' => 'security',
                'type' => 'toggle',
                'default' => false,
            ],
            'security.auto_approve_verified_sellers' => [
                'label' => 'Auto-Approve Enhanced KYC Listings',
                'description' => 'Automatically publish listings from sellers with Enhanced KYC status.',
                'group' => 'security',
                'type' => 'toggle',
                'default' => false,
            ],
        ];
    }

    public function index(): JsonResponse
    {
        $catalog = $this->getDefaultSettingsCatalog();
        $internalKeys = ['auction.conditions', 'auction.currencies', 'auction.types'];

        foreach ($catalog as $key => $meta) {
            PlatformSetting::firstOrCreate(
                ['key' => $key],
                ['value' => $meta['default']]
            );
        }

        $stored = PlatformSetting::whereNotIn('key', $internalKeys)->get()->keyBy('key');
        $result = [];

        foreach ($catalog as $key => $meta) {
            $record = $stored->get($key);
            $rawVal = $record ? $record->value : $meta['default'];
            if (is_array($rawVal) && array_key_exists('value', $rawVal)) {
                $rawVal = $rawVal['value'];
            } elseif (is_array($rawVal)) {
                $rawVal = $meta['default'];
            }

            $result[] = [
                'key' => $key,
                'label' => $meta['label'],
                'description' => $meta['description'],
                'group' => $meta['group'],
                'type' => $meta['type'],
                'value' => $rawVal,
                'options' => $meta['options'] ?? null,
                'updatedAt' => $record?->updated_at?->toIso8601String(),
            ];
        }

        return ApiResponse::success($result);
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        $actor = $request->user();
        if ($request->has('settings') && is_array($request->input('settings'))) {
            foreach ($request->input('settings') as $key => $item) {
                if (is_array($item) && isset($item['key'])) {
                    $this->settingsService->set((string) $item['key'], $item['value'] ?? null, $actor);
                } elseif (is_string($key)) {
                    $this->settingsService->set($key, $item, $actor);
                }
            }
        } elseif ($request->filled('key')) {
            $this->settingsService->set($request->input('key'), $request->input('value'), $actor);
        }

        return $this->index();
    }

    protected function ensureDefaultFlags(): void
    {
        $defaults = [
            'live_bidding_websocket' => ['enabled' => true, 'rollout' => 100],
            'proxy_auto_bidding' => ['enabled' => true, 'rollout' => 100],
            'instant_buy_it_now' => ['enabled' => true, 'rollout' => 100],
            'escrow_wallet_protection' => ['enabled' => true, 'rollout' => 100],
            'seller_kyc_auto_verify' => ['enabled' => false, 'rollout' => 50],
        ];

        if (FeatureFlag::count() === 0) {
            foreach ($defaults as $name => $cfg) {
                FeatureFlag::firstOrCreate(
                    ['name' => $name],
                    [
                        'is_enabled' => $cfg['enabled'],
                        'rollout_percentage' => $cfg['rollout'],
                        'allowlist' => ['admin', 'seller', 'buyer'],
                    ]
                );
            }
        }
    }

    public function flagIndex(): JsonResponse
    {
        $this->ensureDefaultFlags();
        $flags = FeatureFlag::all()->map(fn ($f) => $this->formatFlag($f));
        return ApiResponse::success($flags);
    }

    public function toggleFlag(Request $request, string $name): JsonResponse
    {
        $this->authorize('manageFeatureFlags', \App\Models\User::class);

        $flag = FeatureFlag::where('name', $name)
            ->when(is_numeric($name), fn ($q) => $q->orWhere('id', (int) $name))
            ->first();

        if (!$flag) {
            $flag = FeatureFlag::create([
                'name' => $name,
                'is_enabled' => $request->boolean('enabled', true),
                'rollout_percentage' => (int) $request->input('rolloutPercentage', 100),
                'allowlist' => $request->input('allowedRoles', ['admin', 'seller', 'buyer']),
            ]);
        } else {
            $oldValues = [
                'is_enabled' => (bool) $flag->is_enabled,
                'rollout_percentage' => (int) ($flag->rollout_percentage ?? 100),
            ];

            if ($request->has('enabled')) {
                $flag->is_enabled = $request->boolean('enabled');
            } else {
                $flag->is_enabled = !$flag->is_enabled;
            }

            if ($request->has('rolloutPercentage')) {
                $flag->rollout_percentage = max(0, min(100, (int) $request->input('rolloutPercentage')));
            }

            if ($request->has('allowedRoles') && is_array($request->input('allowedRoles'))) {
                $flag->allowlist = $request->input('allowedRoles');
            }

            $flag->save();

            AuditLog::create([
                'actor_id' => $request->user()?->id,
                'action' => 'feature_flag.updated',
                'subject_type' => FeatureFlag::class,
                'subject_id' => $flag->id,
                'old_values' => $oldValues,
                'new_values' => [
                    'is_enabled' => (bool) $flag->is_enabled,
                    'rollout_percentage' => (int) ($flag->rollout_percentage ?? 100),
                ],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent() ?? 'Admin Web UI',
            ]);
        }

        return ApiResponse::success($this->formatFlag($flag), 'Feature flag updated');
    }

    private function formatFlag(FeatureFlag $f): array
    {
        $descriptions = [
            'live_bidding_websocket' => 'Real-time bid broadcasting and countdown synchronization via WebSockets.',
            'proxy_auto_bidding' => 'Automatic proxy bidding up to the user\'s maximum ceiling amount.',
            'instant_buy_it_now' => 'Allow buyers to purchase eligible auctions immediately at the BIN price.',
            'escrow_wallet_protection' => 'Hold winning bid funds in platform escrow until delivery confirmation.',
            'seller_kyc_auto_verify' => 'Automated identity document pre-screening for seller onboarding.',
        ];

        $allowlist = is_array($f->allowlist) && !empty($f->allowlist)
            ? array_values(array_map('strval', $f->allowlist))
            : ['admin', 'seller', 'buyer'];

        return [
            'id' => (string) $f->id,
            'name' => $f->name,
            'key' => $f->name,
            'description' => $descriptions[$f->name] ?? ('Feature flag for ' . str_replace('_', ' ', $f->name)),
            'is_enabled' => (bool) $f->is_enabled,
            'enabled' => (bool) $f->is_enabled,
            'rolloutPercentage' => (int) ($f->rollout_percentage ?? 100),
            'allowedRoles' => $allowlist,
            'updatedAt' => $f->updated_at?->toIso8601String() ?? now()->toIso8601String(),
        ];
    }
}
