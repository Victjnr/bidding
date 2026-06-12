<?php

namespace App\Contracts\Payment;

use App\Models\DisputeEvidence;

interface IDisputeEvidenceRepository
{
    public function create(array $data): DisputeEvidence;
}
