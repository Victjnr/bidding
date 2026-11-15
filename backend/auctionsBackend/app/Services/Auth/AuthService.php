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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;
use Spatie\Permission\Models\Role;

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

        Role::firstOrCreate(['name' => 'buyer', 'guard_name' => 'web']);
        $user->assignRole('buyer');

        event(new UserRegistered($user));

        return $this->issueTokens($user);
    }

    public function login(LoginDTO $dto): TokenDTO
    {
        $lockKey = "lockout:{$dto->ipAddress}";
        if (Cache::has($lockKey)) {
            abort(429, 'Account locked due to too many failed attempts.');
        }

        $user = $this->userRepository->findByEmail($dto->email);

        if (!$user || !Hash::check($dto->password, $user->password)) {
            $this->handleFailedLogin($dto->ipAddress, $user);
            abort(401, 'Invalid credentials.');
        }

        if ($user->two_factor_enabled) {
            if (!empty($dto->twoFactorCode)) {
                $secret = $this->resolveTwoFactorSecret($user);
                if (!$this->google2FA->verifyKey($secret, $dto->twoFactorCode)) {
                    abort(401, 'Invalid 2FA code.');
                }
                Cache::forget("pending_2fa:{$user->uuid}");
            } else {
                Cache::put("pending_2fa:{$user->uuid}", 1, 300);
                return new TokenDTO(null, null, null, 'Bearer', true);
            }
        }

        $this->resetFailedLogin($dto->ipAddress);
        event(new UserLoggedIn($user, $dto->ipAddress, $dto->userAgent));

        return $this->issueTokens($user);
    }

    public function verifyTwoFactor(string $userId, string $code): TokenDTO
    {
        $pendingKey = "pending_2fa:{$userId}";
        $user = $this->userRepository->findByUuid($userId);
        if (!$user) {
            abort(404, 'User not found.');
        }

        $secret = $this->resolveTwoFactorSecret($user);
        $isValid = $this->google2FA->verifyKey($secret, $code);

        if (!$isValid) {
            abort(401, 'Invalid 2FA code.');
        }

        Cache::forget($pendingKey);
        return $this->issueTokens($user);
    }

    public function refreshToken(string $refreshToken): TokenDTO
    {
        $jti = explode('|', $refreshToken)[0] ?? null;
        if (!$jti || !Cache::has("refresh:{$jti}")) {
            abort(401, 'Invalid or expired refresh token.');
        }

        $userId = Cache::get("refresh:{$jti}");
        $user = $this->userRepository->findByUuid($userId);

        Cache::forget("refresh:{$jti}");

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
        
        // User model casts 'two_factor_secret' => 'encrypted', so assign plaintext directly
        $this->userRepository->update($user, [
            'two_factor_secret' => $secret
        ]);

        $qrUrl = $this->google2FA->getQRCodeUrl(
            config('app.name', 'Upload Auctions'),
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
            'qrCodeUrl' => $qrUrl,
            'backup_codes' => $backupCodes,
            'recoveryCodes' => $backupCodes,
        ];
    }

    public function confirmTwoFactor(User $user, string $code): void
    {
        $secret = $this->resolveTwoFactorSecret($user);
        $isValid = $this->google2FA->verifyKey($secret, $code);

        if (!$isValid) {
            abort(400, 'Invalid 2FA code.');
        }

        $this->userRepository->update($user, [
            'two_factor_enabled' => true
        ]);

        event(new TwoFactorEnabled($user));
    }

    protected function resolveTwoFactorSecret(User $user): string
    {
        $raw = $user->two_factor_secret;
        if (!$raw) {
            return '';
        }
        try {
            return decrypt($raw);
        } catch (\Throwable) {
            return (string) $raw;
        }
    }

    protected function issueTokens(User $user): TokenDTO
    {
        $ttlMinutes = config('security.token_ttl', 15);
        $token = $user->createToken('auth_token', ['*'], Carbon::now()->addMinutes($ttlMinutes));
        
        $jti = Str::uuid()->toString();
        $refreshToken = "{$jti}|" . Str::random(40);
        
        $refreshTtlDays = config('security.refresh_token_ttl', 7);
        Cache::put("refresh:{$jti}", $user->uuid, $refreshTtlDays * 86400);

        return new TokenDTO(
            accessToken: $token->plainTextToken,
            refreshToken: $refreshToken,
            expiresAt: $token->accessToken->expires_at,
        );
    }

    protected function handleFailedLogin(string $ip, ?User $user): void
    {
        $key = "failed:{$ip}";
        $attempts = (int) Cache::get($key, 0) + 1;
        Cache::put($key, $attempts, 900);

        if ($attempts >= config('security.lockout.max_attempts', 5)) {
            Cache::put("lockout:{$ip}", 1, config('security.lockout.decay_minutes', 15) * 60);
        }

        if ($user) {
            event(new FailedLoginAttempt($user, $ip));
        }
    }

    protected function resetFailedLogin(string $ip): void
    {
        Cache::forget("failed:{$ip}");
    }
}
