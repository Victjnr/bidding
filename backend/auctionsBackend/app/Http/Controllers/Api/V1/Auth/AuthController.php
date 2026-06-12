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

        return ApiResponse::success([
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
            'requires_two_factor' => $tokenDTO->requiresTwoFactor,
        ], 'Registration successful', 201);
    }

    public function me(Request $request): JsonResponse
    {
        return ApiResponse::success($request->user(), 'Authenticated user');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $dto = new LoginDTO(
            $request->validated('email'),
            $request->validated('password'),
            $request->ip(),
            $request->userAgent(),
            $request->validated('two_factor_code')
        );

        $tokenDTO = $this->authService->login($dto);

        return ApiResponse::success([
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
            'requires_two_factor' => $tokenDTO->requiresTwoFactor,
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
        $tokenDTO = $this->authService->verifyTwoFactor(
            $request->validated('user_id'),
            $request->validated('code')
        );

        return ApiResponse::success([
            'access_token' => $tokenDTO->accessToken,
            'refresh_token' => $tokenDTO->refreshToken,
            'expires_at' => $tokenDTO->expiresAt,
            'token_type' => $tokenDTO->tokenType,
        ], '2FA verification successful');
    }

    public function disableTwoFactor(PasswordConfirmRequest $request): JsonResponse
    {
        return ApiResponse::success([], '2FA disabled successfully');
    }
}
