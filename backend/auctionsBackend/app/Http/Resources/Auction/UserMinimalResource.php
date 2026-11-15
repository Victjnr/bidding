<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserMinimalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $displayName = $this->display_name ?: trim("{$this->first_name} {$this->last_name}") ?: 'User';
        $avatar = $this->avatar_path ?? $this->avatar_url ?? null;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'displayName' => $displayName,
            'display_name' => $displayName,
            'avatarPath' => $avatar,
            'avatar_url' => $avatar,
            'kycTier' => method_exists($this->resource, 'getNumericKycTier') ? $this->resource->getNumericKycTier() : 0,
            'kyc_tier' => $this->kyc_tier,
            'trustScore' => (int) ($this->trust_score ?? 100),
            'trust_score' => (int) ($this->trust_score ?? 100),
        ];
    }
}
