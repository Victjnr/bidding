<?php

namespace App\DTOs\Auth;

use Carbon\CarbonInterface;

readonly class TokenDTO
{
    public function __construct(
        public ?string $accessToken,
        public ?string $refreshToken,
        public ?CarbonInterface $expiresAt,
        public string $tokenType = 'Bearer',
        public bool $requiresTwoFactor = false,
    ) {}
}
