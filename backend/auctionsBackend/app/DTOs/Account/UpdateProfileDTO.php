<?php

namespace App\DTOs\Account;

readonly class UpdateProfileDTO
{
    public function __construct(
        public ?string $displayName = null,
        public ?string $bio = null,
        public ?string $phone = null,
    ) {}
}
