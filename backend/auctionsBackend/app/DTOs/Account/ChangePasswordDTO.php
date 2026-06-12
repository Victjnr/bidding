<?php

namespace App\DTOs\Account;

readonly class ChangePasswordDTO
{
    public function __construct(
        public string $currentPassword,
        public string $newPassword,
    ) {}
}
