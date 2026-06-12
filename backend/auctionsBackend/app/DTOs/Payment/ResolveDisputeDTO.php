<?php

namespace App\DTOs\Payment;

readonly class ResolveDisputeDTO
{
    public function __construct(
        public string $disputeUuid,
        public int $resolvedByUserId,
        public string $resolution, // 'resolved_buyer' or 'resolved_seller'
        public ?string $resolutionNotes = null,
    ) {}
}
