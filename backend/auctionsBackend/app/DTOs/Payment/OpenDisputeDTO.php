<?php

namespace App\DTOs\Payment;

use App\Enums\DisputeReason;

readonly class OpenDisputeDTO
{
    public function __construct(
        public string $transactionUuid,
        public int $openedByUserId,
        public DisputeReason $reason,
        public string $description,
    ) {}
}
