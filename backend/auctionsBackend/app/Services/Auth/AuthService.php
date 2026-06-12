<?php

namespace App\Services\Auth;

use App\Contracts\Auth\IAuthService;
use App\Contracts\Auth\IUserRepository;
use App\DTOs\Auth\LoginDTO;
use App\DTOs\Auth\RegisterDTO;
use App\DTOs\Auth\TokenDTO;
use App\Enums\UserStatus;
use App\Events\Auth\FailedLoginAttempt;
use App\Events\Auth\TwoFactorEnabled;
use App\Events\Auth\UserLoggedIn;
use App\Events\Auth\UserLoggedOut;
use App\Events\Auth\UserRegistered;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

class AuthService implements IAuthService
{
    public function __construct(
        protected readonly IUserRepository $userRepository,
        protected readonly Google2FA $google2FA
    ) {}

    public function register(RegisterDTO $dto): TokenDTO
    {
        $user = $this->userRepository->create([
            'email' => $dto->email,
            'password' => Hash::make($dto->password),
            'first_name' => $dto->firstName,
            'last_name' => $dto->lastName,
            'display_name' => trim($dto->firstName . ' ' . $dto->lastName),
            'phone' => $dto->phone,
            'status' => UserStatus::Active->value,
        ]);

        $user->assignRole('buyer');

        event(new UserRegistered($user));

        return $this->issueTokens($user);
    }

    public function login(LoginDTO $dto): TokenDTO
    {
        $lockKey = "lockout:{$dto->ipAddress}";
        if (Redis::exists($lockKey)) {
            abort(429, 'Account locked due to too many failed attempts.');
        }

        $user = $this->userRepository->findByEmail($dto->email);

        if (!$user || !Hash::check($dto->password, $user->password)) {
            $this->handleFailedLogin($dto->ipAddress, $user);
            abort(401, 'Invalid credentials.');
        }

        if ($user->two_factor_enabled) {
            Redis::setex("pending_2fa:{$user->uuid}", 300, 1);
            return new TokenDTO(null, null, null, 'Bearer', true);
        }

        $this->resetFailedLogin($dto->ipAddress);
        event(new UserLoggedIn($user, $dto->ipAddress, $dto->userAgent));

        return $this->issueTokens($user);
    }

    public function verifyTwoFactor(string $userId, string $code): TokenDTO
    {
        $pendingKey = "pending_2fa:{$userId}";
        if (!Redis::exists($pendingKey)) {
            abort(401, '2FA session expired or invalid.');
        }

        $user = $this->userRepository->findByUuid($userId);
        if (!$user) {
            abort(404, 'User not found.');
        }

        $isValid = $this->google2FA->verifyKey(decrypt($user->two_factor_secret), $code);

        if (!$isValid) {
            abort(401, 'Invalid 2FA code.');
        }

        Redis::del($pendingKey);
        return $this->issueTokens($user);
    }

    public function refreshToken(string $refreshToken): TokenDTO
    {
        $jti = explode('|', $refreshToken)[0] ?? null;
        if (!$jti || !Redis::exists("refresh:{$jti}")) {
            abort(401, 'Invalid or expired refresh token.');
        }

        $userId = Redis::get("refresh:{$jti}");
        $user = $this->userRepository->findByUuid($userId);

        Redis::del("refresh:{$jti}");

        if (!$user) {
            abort(401, 'User no longer exists.');
        }

        return $this->issueTokens($user);
    }

    public function logout(User $user): void
    {
        $user->currentAccessToken()?->delete();
        event(new UserLoggedOut($user));
    }

    public function enableTwoFactor(User $user): array
    {
        $secret = $this->google2FA->generateSecretKey();
        
        $this->userRepository->update($user, [
            'two_factor_secret' => encrypt($secret)
        ]);

        $qrUrl = $this->google2FA->getQRCodeUrl(
            config('app.name'),
            $user->email,
            $secret
        );

        $backupCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $backupCodes[] = Str::random(10);
        }
        
        return [
            'secret' => $secret,
            'qr_url' => $qrUrl,
            'backup_codes' => $backupCodes,
        ];
    }

    public function confirmTwoFactor(User $user, string $code): void
    {
        $isValid = $this->google2FA->verifyKey(decrypt($user->two_factor_secret), $code);

        if (!$isValid) {
            abort(400, 'Invalid 2FA code.');
        }

        $this->userRepository->update($user, [
            'two_factor_enabled' => true
        ]);

        event(new TwoFactorEnabled($user));
    }

    protected function issueTokens(User $user): TokenDTO
    {
        $ttlMinutes = config('security.token_ttl', 15);
        $token = $user->createToken('auth_token', ['*'], Carbon::now()->addMinutes($ttlMinutes));
        
        $jti = Str::uuid()->toString();
        $refreshToken = "{$jti}|" . Str::random(40);
        
        $refreshTtlDays = config('security.refresh_token_ttl', 7);
        Redis::setex("refresh:{$jti}", $refreshTtlDays * 86400, $user->uuid);

        return new TokenDTO(
            accessToken: $token->plainTextToken,
            refreshToken: $refreshToken,
            expiresAt: $token->accessToken->expires_at,
        );
    }

    protected function handleFailedLogin(string $ip, ?User $user): void
    {
        $key = "failed:{$ip}";
        $attempts = Redis::incr($key);
        Redis::expire($key, 900);

        if ($attempts >= config('security.lockout.max_attempts', 5)) {
            Redis::setex("lockout:{$ip}", config('security.lockout.decay_minutes', 15) * 60, 1);
        }

        if ($user) {
            event(new FailedLoginAttempt($user, $ip));
        }
    }

    protected function resetFailedLogin(string $ip): void
    {
        Redis::del("failed:{$ip}");
    }
}
