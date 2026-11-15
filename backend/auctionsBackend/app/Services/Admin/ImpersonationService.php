<?php

namespace App\Services\Admin;

use App\Contracts\Admin\IAuditService;
use App\Contracts\Admin\IImpersonationService;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
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

        $tokenResult = $target->createToken("impersonation:{$admin->id}:{$jti}", ['impersonation']);
        
        Cache::put("impersonation:{$jti}", [
            'admin_id' => $admin->id,
            'target_id' => $target->id,
            'jti' => $jti
        ], 900);

        $this->auditService->log("user.impersonated", $target, [], $admin);

        return $tokenResult->plainTextToken;
    }

    public function stopImpersonating(string $jti): void
    {
        Cache::forget("impersonation:{$jti}");
    }
}
