<?php

namespace App\Repositories\Payment;

use App\Contracts\Payment\ITransactionRepository;
use App\Models\Transaction;

class TransactionRepository implements ITransactionRepository
{
    public function create(array $data): Transaction
    {
        return Transaction::create($data);
    }

    public function updateStatus(string $uuid, string $status): bool
    {
        return Transaction::where('uuid', $uuid)->update(['status' => $status]) > 0;
    }

    public function findByAuctionAndBuyer(int $auctionId, int $buyerId): ?Transaction
    {
        return Transaction::where('auction_id', $auctionId)
            ->where('buyer_id', $buyerId)
            ->first();
    }
}
