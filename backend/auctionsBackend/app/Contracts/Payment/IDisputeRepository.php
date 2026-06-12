<?php

namespace App\Contracts\Payment;

use App\Models\Dispute;

interface IDisputeRepository
{
    public function create(array $data): Dispute;
    public function findOpenForTransaction(int $transactionId): ?Dispute;
}
