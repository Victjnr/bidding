<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserMinimalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'kyc_tier' => $this->kyc_tier,
            'trust_score' => $this->trust_score,
        ];
    }
}
