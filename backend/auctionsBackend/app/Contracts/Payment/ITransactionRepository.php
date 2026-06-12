<?php

namespace App\Contracts\Payment;

use App\Models\Transaction;

interface ITransactionRepository
{
    public function create(array $data): Transaction;
    public function updateStatus(string $uuid, string $status): bool;
    public function findByAuctionAndBuyer(int $auctionId, int $buyerId): ?Transaction;
}
