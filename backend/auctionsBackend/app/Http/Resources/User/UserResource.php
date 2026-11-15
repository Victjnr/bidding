<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $displayName = $this->display_name ?: trim("{$this->first_name} {$this->last_name}");
        $avatar = $this->avatar_path ?? $this->avatar_url ?? null;
        $statusVal = $this->status instanceof \BackedEnum ? $this->status->value : (string) ($this->status ?? 'active');
        $kycNumeric = method_exists($this->resource, 'getNumericKycTier') ? $this->resource->getNumericKycTier() : 0;
        $roles = method_exists($this->resource, 'getRoleNames') ? $this->getRoleNames()->values()->all() : ['buyer'];

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'email' => $this->email,
            'firstName' => $this->first_name,
            'first_name' => $this->first_name,
            'lastName' => $this->last_name,
            'last_name' => $this->last_name,
            'displayName' => $displayName,
            'display_name' => $displayName,
            'name' => $displayName,
            'phone' => $this->phone,
            'bio' => $this->bio,
            'avatarPath' => $avatar,
            'avatar_path' => $avatar,
            'avatar_url' => $avatar,
            'kycTier' => $kycNumeric,
            'kyc_tier' => $this->kyc_tier,
            'roles' => $roles,
            'emailVerifiedAt' => $this->email_verified_at?->toIso8601String(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'phoneVerifiedAt' => $this->phone_verified_at?->toIso8601String(),
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'twoFactorEnabled' => (bool) $this->two_factor_enabled,
            'two_factor_enabled' => (bool) $this->two_factor_enabled,
            'anonymousBidding' => (bool) ($this->is_anonymous ?? false),
            'is_anonymous' => (bool) ($this->is_anonymous ?? false),
            'status' => $statusVal,
            'trustScore' => (int) ($this->trust_score ?? 100),
            'trust_score' => (int) ($this->trust_score ?? 100),
            'joinedAt' => ($this->member_since ?? $this->created_at)?->toIso8601String() ?? now()->toIso8601String(),
            'member_since' => ($this->member_since ?? $this->created_at)?->toIso8601String(),
            'createdAt' => $this->created_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
