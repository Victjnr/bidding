<?php

namespace App\DTOs\Auth;

readonly class LoginDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public string $ipAddress,
        public string $userAgent,
        public ?string $twoFactorCode = null,
    ) {}
}
