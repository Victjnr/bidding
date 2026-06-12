<?php

namespace App\Services\Payment;

use App\Contracts\Payment\ICommissionService;
use App\Contracts\Payment\ICommissionTierRepository;
use App\DTOs\Payment\FeeBreakdownDTO;
use App\Models\Auction;

class CommissionService implements ICommissionService
{
    public function __construct(
        protected readonly ICommissionTierRepository $commissionTierRepository
    ) {}

    public function calculateFees(Auction $auction, float $salePrice): FeeBreakdownDTO
    {
        $seller = $auction->seller;
        $sellerTier = $seller->tier ?? null; // assuming tier is on User model or we handle null

        $tier = $this->commissionTierRepository->findApplicableTier($auction->category_id, $sellerTier);

        if (!$tier) {
            // Default fallback if no tiers configured
            return new FeeBreakdownDTO(
                grossAmount: $salePrice,
                feeAmount: 0.0,
                netAmount: $salePrice,
            );
        }

        $percentageFee = $salePrice * ((float) $tier->percentage / 100);
        $fixedFee = (float) $tier->fixed_fee;

        $totalFee = $percentageFee + $fixedFee;

        // Apply min floor and max cap
        if ($tier->min_fee !== null && $totalFee < $tier->min_fee) {
            $totalFee = (float) $tier->min_fee;
        }

        if ($tier->max_fee !== null && $totalFee > $tier->max_fee) {
            $totalFee = (float) $tier->max_fee;
        }

        // Ensure fee does not exceed sale price
        $totalFee = min($totalFee, $salePrice);

        return new FeeBreakdownDTO(
            grossAmount: $salePrice,
            feeAmount: round($totalFee, 2),
            netAmount: round($salePrice - $totalFee, 2),
        );
    }
}
