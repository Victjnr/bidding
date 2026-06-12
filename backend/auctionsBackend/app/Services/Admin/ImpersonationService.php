<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Contracts\Admin\IImpersonationService;
use App\Models\User;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class ImpersonationService implements IImpersonationService
{
    public function __construct(
        protected readonly IAuditService $auditService
    ) {}

    public function impersonate(User $admin, User $target): string
    {
        if ($target->hasRole('super_admin')) {
            throw new \Exception("Cannot impersonate another super_admin.");
        }

        $jti = Str::uuid()->toString();

        // Target user creates token on behalf of the admin
        // The token abilities indicate it's an impersonation token
        $tokenResult = $target->createToken("impersonation:{$admin->id}:{$jti}", ['impersonation']);
        
        // Track the session in Redis (TTL 15 mins)
        Redis::setex("impersonation:{$jti}", 900, json_encode([
            'admin_id' => $admin->id,
            'target_id' => $target->id,
            'jti' => $jti
        ]));

        $this->auditService->log("user.impersonated", $target, [], $admin);

        return $tokenResult->plainTextToken;
    }

    public function stopImpersonating(string $jti): void
    {
        Redis::del("impersonation:{$jti}");
        // Ideally, we could also revoke the actual Sanctum token by finding it via name
        // \Laravel\Sanctum\PersonalAccessToken::where('name', 'like', "%{$jti}%")->delete();
    }
}
