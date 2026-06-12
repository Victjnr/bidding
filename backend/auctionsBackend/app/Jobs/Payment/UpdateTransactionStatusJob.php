<?php

namespace App\Jobs\Payment;

use App\Contracts\Payment\ITransactionRepository;
use App\Enums\TransactionStatus;
use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateTransactionStatusJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public array $paymentIntentData
    ) {}

    public function handle(ITransactionRepository $transactionRepository): void
    {
        $intentId = $this->paymentIntentData['id'];
        
        $transaction = Transaction::where('provider_transaction_id', $intentId)->first();
        
        if ($transaction && $transaction->status !== TransactionStatus::Completed) {
            $transactionRepository->updateStatus($transaction->uuid, TransactionStatus::Completed->value);
            // Additional logic like firing events can happen here.
        }
    }
}
