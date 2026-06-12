<?php

namespace App\Contracts\Payment;

use App\Models\CommissionTier;

interface ICommissionTierRepository
{
    public function findApplicableTier(?int $categoryId, ?int $sellerTier): ?CommissionTier;
}
