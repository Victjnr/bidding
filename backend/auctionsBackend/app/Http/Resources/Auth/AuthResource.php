<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuthResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'email' => $this->email,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'display_name' => $this->display_name,
            'avatar_url' => $this->avatar_url,
            'status' => $this->status->label(),
            'kyc_tier' => $this->kyc_tier,
            'two_factor_enabled' => $this->two_factor_enabled,
            'roles' => $this->getRoleNames(),
        ];
    }
}
