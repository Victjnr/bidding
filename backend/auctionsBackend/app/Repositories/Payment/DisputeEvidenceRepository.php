<?php

namespace App\Repositories\Payment;

use App\Contracts\Payment\IDisputeEvidenceRepository;
use App\Models\DisputeEvidence;

class DisputeEvidenceRepository implements IDisputeEvidenceRepository
{
    public function create(array $data): DisputeEvidence
    {
        return DisputeEvidence::create($data);
    }
}
