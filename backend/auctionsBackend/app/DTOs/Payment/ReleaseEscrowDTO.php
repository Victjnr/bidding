<?php

namespace App\DTOs\Payment;

readonly class ReleaseEscrowDTO
{
    public function __construct(
        public string $transactionUuid,
        public int $authorizedByUserId, // The buyer or an admin resolving a dispute
    ) {}
}
