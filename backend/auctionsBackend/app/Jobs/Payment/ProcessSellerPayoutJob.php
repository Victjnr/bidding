<?php

namespace App\Jobs\Payment;

use App\Contracts\Payment\IPaymentProvider;
use App\Models\Transaction;
use App\Services\Payment\PaymentProviderFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessSellerPayoutJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Transaction $transaction
    ) {}

    public function handle(): void
    {
        $seller = $this->transaction->seller;
        
        // In a real app, the seller would have a connected Stripe Connect account ID
        $destinationId = $seller->stripe_account_id ?? null;
        
        if (!$destinationId) {
            Log::warning("Cannot process payout for Transaction {$this->transaction->id} - Seller {$seller->id} has no connected account.");
            return;
        }

        $provider = PaymentProviderFactory::make('stripe');
        
        try {
            $payoutId = $provider->createPayout(
                amount: (float) $this->transaction->net_amount,
                currency: $this->transaction->currency,
                destination: $destinationId
            );
            
            Log::info("Payout created for Transaction {$this->transaction->id}", ['payout_id' => $payoutId]);
            // Could save payout_id on the Transaction or a new Payout model
            
        } catch (\Exception $e) {
            Log::error("Failed to create payout for Transaction {$this->transaction->id}", ['error' => $e->getMessage()]);
            $this->fail($e);
        }
    }
}
