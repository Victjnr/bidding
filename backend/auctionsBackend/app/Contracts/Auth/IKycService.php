<?php

namespace App\Contracts\Auth;

use App\DTOs\Auth\ReviewKycDTO;
use App\DTOs\Auth\UploadKycDTO;
use App\Models\KycDocument;

interface IKycService
{
    public function upload(UploadKycDTO $dto): KycDocument;
    public function review(ReviewKycDTO $dto): KycDocument;
}
