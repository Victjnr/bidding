<?php

namespace App\Contracts\Payment;

interface IWalletService
{
    public function balance(int $userId): float;
    public function credit(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void;
    public function debit(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void;
    public function hold(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void;
    public function release(int $userId, float $amount, ?int $transactionId = null, string $description = ''): void;
}
