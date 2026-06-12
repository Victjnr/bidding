<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'kyc_tier' => $this->kyc_tier,
            'trust_score' => $this->trust_score,
            'member_since' => $this->member_since?->toISOString(),
        ];
    }
}
