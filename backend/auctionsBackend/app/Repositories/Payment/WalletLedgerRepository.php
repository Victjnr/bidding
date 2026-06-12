<?php

namespace App\Repositories\Payment;

use App\Contracts\Payment\IWalletLedgerRepository;
use App\Models\WalletLedger;
use Illuminate\Support\Facades\DB;

class WalletLedgerRepository implements IWalletLedgerRepository
{
    public function create(array $data): WalletLedger
    {
        return WalletLedger::create($data);
    }

    public function balanceForUser(int $userId): float
    {
        $balance = WalletLedger::where('user_id', $userId)
            ->selectRaw("SUM(CASE 
                WHEN type IN ('credit', 'release') THEN amount 
                WHEN type IN ('debit', 'hold') THEN -amount 
                ELSE 0 
            END) as bal")
            ->value('bal');

        return (float) ($balance ?? 0.0);
    }
}
