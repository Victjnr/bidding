<?php

namespace App\DTOs\Auth;

readonly class RegisterDTO
{
    public function __construct(
        public string $email,
        public string $password,
        public string $firstName,
        public string $lastName,
        public bool $termsAccepted,
        public ?string $phone = null,
    ) {}
}
