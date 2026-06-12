<?php

namespace App\Contracts\Payment;

use App\DTOs\Payment\FeeBreakdownDTO;
use App\Models\Auction;

interface ICommissionService
{
    public function calculateFees(Auction $auction, float $salePrice): FeeBreakdownDTO;
}
