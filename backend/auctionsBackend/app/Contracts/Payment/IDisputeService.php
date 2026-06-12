<?php

namespace App\Contracts\Payment;

use App\DTOs\Payment\OpenDisputeDTO;
use App\DTOs\Payment\ResolveDisputeDTO;
use App\Models\Dispute;
use Illuminate\Http\UploadedFile;

interface IDisputeService
{
    public function openDispute(OpenDisputeDTO $dto): Dispute;
    /**
     * @param UploadedFile[] $files
     */
    public function uploadEvidence(string $disputeUuid, int $userId, array $files): array;
    public function resolve(ResolveDisputeDTO $dto): Dispute;
}
