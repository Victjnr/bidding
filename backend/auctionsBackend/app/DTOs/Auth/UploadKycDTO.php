<?php

namespace App\DTOs\Auth;

use App\Enums\KycDocumentType;
use Illuminate\Http\UploadedFile;

readonly class UploadKycDTO
{
    public function __construct(
        public string $userId,
        public KycDocumentType $type,
        public UploadedFile $file,
    ) {}
}
