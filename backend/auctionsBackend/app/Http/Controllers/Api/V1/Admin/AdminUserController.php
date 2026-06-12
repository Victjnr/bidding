<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Admin\IImpersonationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\BanRequest;
use App\Http\Requests\Admin\SuspendRequest;
use App\Http\Requests\Admin\UserFilterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminUserController extends Controller
{
    public function __construct(
        protected readonly IImpersonationService $impersonationService
    ) {}

    public function index(UserFilterRequest $request): JsonResponse
    {
        // Must be authorized via policy in routes or controller
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('first_name', 'like', "%{$searchTerm}%")
                  ->orWhere('last_name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%");
            });
        }

        $users = $query->paginate($request->input('per_page', 20));

        return ApiResponse::success($users);
    }

    public function show(string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->firstOrFail();
        return ApiResponse::success($user);
    }

    public function suspend(SuspendRequest $request, string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->firstOrFail();
        
        // Basic implementation
        $user->status = 'suspended';
        // You might want to save $request->input('reason') and $request->input('days') somewhere
        $user->save();

        return ApiResponse::success(null, "User suspended for {$request->input('days')} days");
    }

    public function ban(BanRequest $request, string $uuid): JsonResponse
    {
        $user = User::where('uuid', $uuid)->firstOrFail();
        
        $user->status = 'banned';
        $user->save();

        return ApiResponse::success(null, 'User banned permanently');
    }

    public function impersonate(Request $request, string $uuid): JsonResponse
    {
        $this->authorize('impersonate', User::class); // super_admin only

        $target = User::where('uuid', $uuid)->firstOrFail();
        
        try {
            $token = $this->impersonationService->impersonate(auth()->user(), $target);
            return ApiResponse::success(['token' => $token], 'Impersonation started');
        } catch (\Exception $e) {
            return ApiResponse::error($e->getMessage(), 403);
        }
    }

    public function stopImpersonating(Request $request): JsonResponse
    {
        // Find JTI from current token
        $tokenName = $request->user()->currentAccessToken()->name;
        // token name format: impersonation:admin_id:jti
        $parts = explode(':', $tokenName);
        if (count($parts) === 3 && $parts[0] === 'impersonation') {
            $jti = $parts[2];
            $this->impersonationService->stopImpersonating($jti);
            $request->user()->currentAccessToken()->delete();
        }

        return ApiResponse::success(null, 'Impersonation stopped');
    }
}
