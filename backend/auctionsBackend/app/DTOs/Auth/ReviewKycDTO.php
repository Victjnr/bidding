<?php

namespace App\DTOs\Auth;

use App\Enums\KycStatus;

readonly class ReviewKycDTO
{
    public function __construct(
        public string $documentId,
        public KycStatus $status,
        public string $reviewedBy,
        public ?string $rejectionReason = null,
    ) {}
}
