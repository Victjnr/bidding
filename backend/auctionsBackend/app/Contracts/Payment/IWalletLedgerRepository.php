<?php

namespace App\Contracts\Payment;

use App\Models\WalletLedger;

interface IWalletLedgerRepository
{
    public function create(array $data): WalletLedger;
    public function balanceForUser(int $userId): float;
}
