<?php

namespace App\Services\Payment;

use App\Contracts\Payment\IWalletLedgerRepository;
use App\Contracts\Payment\IWalletService;
use App\Enums\WalletEntryType;
use Illuminate\Support\Facades\DB;

class WalletService implements IWalletService
{
    public function __construct(
        protected readonly IWalletLedgerRepository $ledgerRepository
    ) {}

    public function balance(int $userId): float
    {
        return $this->ledgerRepository->balanceForUser($userId);
    }

    public function credit(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void
    {
        if ($amount <= 0) return;

        DB::transaction(function () use ($userId, $amount, $transactionId, $description) {
            $this->ledgerRepository->create([
                'user_id' => $userId,
                'transaction_id' => $transactionId,
                'type' => WalletEntryType::Credit,
                'amount' => $amount,
                'currency' => 'USD', // defaulting for simplicity
                'description' => $description,
            ]);
        });
    }

    public function debit(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void
    {
        if ($amount <= 0) return;

        DB::transaction(function () use ($userId, $amount, $transactionId, $description) {
            $this->ledgerRepository->create([
                'user_id' => $userId,
                'transaction_id' => $transactionId,
                'type' => WalletEntryType::Debit,
                'amount' => $amount,
                'currency' => 'USD',
                'description' => $description,
            ]);
        });
    }

    public function hold(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void
    {
        if ($amount <= 0) return;

        DB::transaction(function () use ($userId, $amount, $transactionId, $description) {
            $this->ledgerRepository->create([
                'user_id' => $userId,
                'transaction_id' => $transactionId,
                'type' => WalletEntryType::Hold,
                'amount' => $amount,
                'currency' => 'USD',
                'description' => $description,
            ]);
        });
    }

    public function release(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void
    {
        if ($amount <= 0) return;

        DB::transaction(function () use ($userId, $amount, $transactionId, $description) {
            $this->ledgerRepository->create([
                'user_id' => $userId,
                'transaction_id' => $transactionId,
                'type' => WalletEntryType::Release,
                'amount' => $amount,
                'currency' => 'USD',
                'description' => $description,
            ]);
        });
    }
}
