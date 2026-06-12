<?php

namespace App\DTOs\Payment;

readonly class FeeBreakdownDTO
{
    public function __construct(
        public float $grossAmount,
        public float $feeAmount,
        public float $netAmount,
    ) {}
}
