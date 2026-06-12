<?php

namespace App\Contracts\Auth;

use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\DTOs\Auth\TokenDTO;
use App\Models\User;

interface IAuthService
{
    public function register(RegisterDTO $dto): TokenDTO;
    public function login(LoginDTO $dto): TokenDTO;
    public function verifyTwoFactor(string $userId, string $code): TokenDTO;
    public function refreshToken(string $refreshToken): TokenDTO;
    public function logout(User $user): void;
    public function enableTwoFactor(User $user): array;
    public function confirmTwoFactor(User $user, string $code): void;
}
