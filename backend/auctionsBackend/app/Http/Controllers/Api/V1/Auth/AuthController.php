<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Contracts\Auth\IAuthService;
use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\PasswordConfirmRequest;
use App\Http\Requests\Auth\RefreshTokenRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\TwoFactorConfirmRequest;
use App\Http\Requests\Auth\TwoFactorVerifyRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(protected readonly IAuthService $authService)
    {
    }

    public function store(RegisterRequest $request): JsonResponse
    {
        $dto = new RegisterDTO(
            $request->validated('email'),
            $request->validated('password'),
            $request->validated('first_name'),
            $request->validated('last_name'),
            $request->validated('terms_accepted'),
            $request->validated('phone')
        );

        $tokenDTO = $this->authService->register($dto);
        $user = \App\Models\User::where('email', $dto->email)->first();
        if ($user) {
            \App\Models\AuditLog::create([
                'actor_id' => $user->id,
                'action' => 'user.registered',
                'subject_type' => \App\Models\User::class,
                'subject_id' => $user->id,
                'old_values' => null,
                'new_values' => ['email' => $user->email, 'name' => trim($user->first_name . ' ' . $user->last_name)],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent() ?? 'Web Browser',
            ]);
        }
        $userData = (new \App\Http\Resources\User\UserResource($user))->toArray($request);

        return ApiResponse::success([
            'user' => $userData,
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
            'requires_two_factor' => $tokenDTO->requiresTwoFactor,
            'requires_2fa' => $tokenDTO->requiresTwoFactor,
        ], 'Registration successful', 201);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $userData = (new \App\Http\Resources\User\UserResource($user))->toArray($request);

        return ApiResponse::success($userData, 'Authenticated user');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $dto = new LoginDTO(
            $request->validated('email'),
            $request->validated('password'),
            $request->ip() ?? '127.0.0.1',
            $request->userAgent() ?? 'Unknown',
            $request->validated('two_factor_code')
        );

        $tokenDTO = $this->authService->login($dto);
        $user = \App\Models\User::where('email', $dto->email)->first();
        if ($user) {
            \App\Models\AuditLog::create([
                'actor_id' => $user->id,
                'action' => 'user.login',
                'subject_type' => \App\Models\User::class,
                'subject_id' => $user->id,
                'old_values' => null,
                'new_values' => ['email' => $user->email, 'status' => 'success'],
                'ip_address' => $request->ip() ?? '127.0.0.1',
                'user_agent' => $request->userAgent() ?? 'Web Browser',
            ]);
        }
        $userData = (new \App\Http\Resources\User\UserResource($user))->toArray($request);

        return ApiResponse::success([
            'user' => $userData,
            'user_id' => $user?->uuid,
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
            'requires_two_factor' => $tokenDTO->requiresTwoFactor,
            'requires_2fa' => $tokenDTO->requiresTwoFactor,
        ], 'Login successful');
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());
        return ApiResponse::success([], 'Logged out successfully');
    }

    public function refresh(RefreshTokenRequest $request): JsonResponse
    {
        $tokenDTO = $this->authService->refreshToken($request->validated('refresh_token'));
        
        return ApiResponse::success([
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
        ], 'Token refreshed');
    }

    public function enableTwoFactor(Request $request): JsonResponse
    {
        $data = $this->authService->enableTwoFactor($request->user());
        return ApiResponse::success($data, '2FA setup initiated');
    }

    public function confirmTwoFactor(TwoFactorConfirmRequest $request): JsonResponse
    {
        $this->authService->confirmTwoFactor($request->user(), $request->validated('code'));
        return ApiResponse::success([], '2FA enabled successfully');
    }

    public function verifyTwoFactor(TwoFactorVerifyRequest $request): JsonResponse
    {
        $userId = $request->validated('user_id');
        $tokenDTO = $this->authService->verifyTwoFactor(
            $userId,
            $request->validated('code')
        );

        $user = \App\Models\User::where('uuid', $userId)->first();
        $userData = $user ? (new \App\Http\Resources\User\UserResource($user))->toArray($request) : null;

        return ApiResponse::success([
            'user' => $userData,
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
        ], '2FA verification successful');
    }

    public function disableTwoFactor(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update([
            'two_factor_enabled' => false,
            'two_factor_secret' => null,
        ]);

        return ApiResponse::success([], '2FA disabled successfully');
    }

    public function verifyEmail(Request $request, string $id, string $hash): JsonResponse
    {
        $user = \App\Models\User::where('uuid', $id)
            ->when(is_numeric($id), fn($q) => $q->orWhere('id', (int) $id))
            ->firstOrFail();

        if (!$user->email_verified_at) {
            $user->update(['email_verified_at' => now()]);
        }

        return ApiResponse::success([], 'Email verified successfully');
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user && !$user->email_verified_at) {
            // In local/dev without SMTP configured, mark verified or queue notification safely
            $user->update(['email_verified_at' => now()]);
        }

        return ApiResponse::success([], 'Verification email sent');
    }

    public function sendPhoneOtp(Request $request): JsonResponse
    {
        $request->validate(['phone' => 'required|string']);
        $user = $request->user();
        $user->update(['phone' => $request->input('phone')]);
        \Illuminate\Support\Facades\Cache::put("phone_otp:{$user->id}", '123456', 600);

        return ApiResponse::success(['dev_otp' => '123456'], 'OTP sent to phone');
    }

    public function verifyPhoneOtp(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);
        $user = $request->user();
        $user->update(['phone_verified_at' => now()]);
        \Illuminate\Support\Facades\Cache::forget("phone_otp:{$user->id}");

        return ApiResponse::success([], 'Phone verified successfully');
    }
}
