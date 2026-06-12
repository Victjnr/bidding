<?php

namespace App\DTOs\Payment;

readonly class CaptureEscrowDTO
{
    public function __construct(
        public int $auctionId,
        public int $buyerId,
        public string $paymentMethodId, // e.g., 'pm_123...' from frontend
    ) {}
}
