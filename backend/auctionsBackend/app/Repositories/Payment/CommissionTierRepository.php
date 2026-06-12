<?php

namespace App\Repositories\Payment;

use App\Contracts\Payment\ICommissionTierRepository;
use App\Models\CommissionTier;

class CommissionTierRepository implements ICommissionTierRepository
{
    public function findApplicableTier(?int $categoryId, ?int $sellerTier): ?CommissionTier
    {
        $today = now();

        return CommissionTier::where(function ($q) use ($categoryId) {
                $q->where('category_id', $categoryId)
                  ->orWhereNull('category_id');
            })
            ->where(function ($q) use ($sellerTier) {
                $q->where('seller_tier', $sellerTier)
                  ->orWhereNull('seller_tier');
            })
            ->where('effective_from', '<=', $today)
            ->where(function ($q) use ($today) {
                $q->where('effective_to', '>=', $today)
                  ->orWhereNull('effective_to');
            })
            // Order by specificity: defined category beats null, defined tier beats null
            ->orderByRaw('category_id IS NULL ASC')
            ->orderByRaw('seller_tier IS NULL ASC')
            ->first();
    }
}
