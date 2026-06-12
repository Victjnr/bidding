<?php

namespace App\Repositories\Payment;

use App\Contracts\Payment\IDisputeRepository;
use App\Enums\DisputeStatus;
use App\Models\Dispute;

class DisputeRepository implements IDisputeRepository
{
    public function create(array $data): Dispute
    {
        return Dispute::create($data);
    }

    public function findOpenForTransaction(int $transactionId): ?Dispute
    {
        return Dispute::where('transaction_id', $transactionId)
            ->whereIn('status', [
                DisputeStatus::Open,
                DisputeStatus::UnderReview,
                DisputeStatus::Escalated,
            ])
            ->first();
    }
}
