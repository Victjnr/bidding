<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Admin\IFeatureFlagService;
use App\Contracts\Admin\ISettingsService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SettingsRequest;
use App\Models\FeatureFlag;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;

class AdminSettingsController extends Controller
{
    public function __construct(
        protected readonly ISettingsService $settingsService,
        protected readonly IFeatureFlagService $featureFlagService
    ) {}

    public function index(): JsonResponse
    {
        $settings = PlatformSetting::all();
        return ApiResponse::success($settings);
    }

    public function update(SettingsRequest $request): JsonResponse
    {
        $this->settingsService->set($request->input('key'), $request->input('value'), auth()->user());
        return ApiResponse::success(null, 'Setting updated successfully');
    }

    public function flagIndex(): JsonResponse
    {
        $flags = FeatureFlag::all();
        return ApiResponse::success($flags);
    }

    public function toggleFlag(string $name): JsonResponse
    {
        $this->authorize('manageFeatureFlags', \App\Models\User::class); // super_admin only

        $this->featureFlagService->toggle($name, auth()->user());
        
        $flag = FeatureFlag::where('name', $name)->first();
        return ApiResponse::success($flag, 'Feature flag toggled');
    }
}
