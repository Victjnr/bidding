<?php

namespace App\Services\Payment;

use App\Contracts\Payment\ICommissionService;
use App\Contracts\Payment\IPaymentService;
use App\Contracts\Payment\ITransactionRepository;
use App\Contracts\Payment\IWalletService;
use App\DTOs\Payment\CaptureEscrowDTO;
use App\DTOs\Payment\ReleaseEscrowDTO;
use App\Enums\TransactionStatus;
use App\Enums\TransactionType;
use App\Events\Payment\EscrowReleased;
use App\Events\Payment\PaymentCaptured;
use App\Exceptions\AuctionNotActiveException;
use App\Exceptions\PaymentCapturedException;
use App\Jobs\Payment\ProcessSellerPayoutJob;
use App\Models\Auction;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PaymentService implements IPaymentService
{
    public function __construct(
        protected readonly ITransactionRepository $transactionRepository,
        protected readonly ICommissionService $commissionService,
        protected readonly IWalletService $walletService,
    ) {}

    public function capturePayment(CaptureEscrowDTO $dto): Transaction
    {
        // Check Idempotency: if transaction already exists for this auction/buyer
        $existing = $this->transactionRepository->findByAuctionAndBuyer($dto->auctionId, $dto->buyerId);
        
        if ($existing) {
            if ($existing->status === TransactionStatus::Completed) {
                return $existing; // Idempotent success
            }
            if ($existing->status === TransactionStatus::Processing) {
                throw new PaymentCapturedException('Payment is currently processing.');
            }
        }

        $auction = Auction::findOrFail($dto->auctionId);
        
        if ($auction->buyer_id !== $dto->buyerId && $auction->winner_id !== $dto->buyerId) {
            throw new InvalidArgumentException('User is not the winner of this auction.');
        }

        $salePrice = (float) $auction->current_price;

        $feeBreakdown = $this->commissionService->calculateFees($auction, $salePrice);

        // Abstract provider logic goes here.
        // For example:
        $provider = PaymentProviderFactory::make('stripe');
        
        // In real life, createPaymentIntent would likely be called from a frontend endpoint earlier
        // and we would be capturing it here, but we simplify for demonstration:
        $intent = $provider->createPaymentIntent($salePrice, 'USD', [
            'auction_id' => $auction->id,
            'buyer_id' => $dto->buyerId,
        ]);

        return DB::transaction(function () use ($dto, $auction, $feeBreakdown, $provider, $intent) {
            $transaction = $this->transactionRepository->create([
                'auction_id' => $auction->id,
                'buyer_id' => $dto->buyerId,
                'seller_id' => $auction->seller_id,
                'type' => TransactionType::Charge,
                'status' => TransactionStatus::Processing,
                'gross_amount' => $feeBreakdown->grossAmount,
                'net_amount' => $feeBreakdown->netAmount,
                'fee_amount' => $feeBreakdown->feeAmount,
                'currency' => 'USD',
                'provider_transaction_id' => $intent['id'] ?? null,
            ]);

            // Capture the intent
            if (isset($intent['id'])) {
                $provider->capturePaymentIntent($intent['id']);
            }

            $this->transactionRepository->updateStatus($transaction->uuid, TransactionStatus::Completed->value);
            
            // Hold funds in buyer's ledger (they paid, so it's a debit from their external payment, but "held" in system logic if they have a balance, or we just represent the escrow as a hold)
            // Actually, typical escrow ledger: we credit the buyer to acknowledge receipt, then immediately hold.
            $this->walletService->credit($dto->buyerId, $feeBreakdown->grossAmount, $transaction->id, 'Funds received for auction ' . $auction->id);
            $this->walletService->hold($dto->buyerId, $feeBreakdown->grossAmount, $transaction->id, 'Escrow hold for auction ' . $auction->id);

            event(new PaymentCaptured($transaction));

            return $transaction->fresh();
        });
    }

    public function releaseEscrow(ReleaseEscrowDTO $dto): Transaction
    {
        $transaction = Transaction::where('uuid', $dto->transactionUuid)->firstOrFail();

        if ($transaction->status !== TransactionStatus::Completed) {
            throw new InvalidArgumentException("Transaction is not completed, status is {$transaction->status->value}");
        }

        if ($transaction->escrow_released_at !== null) {
            return $transaction; // Idempotent
        }

        DB::transaction(function () use ($transaction) {
            // Release the hold from buyer
            $this->walletService->release($transaction->buyer_id, (float) $transaction->gross_amount, $transaction->id, 'Escrow released');
            // Debit from buyer (transfer out of their logical balance)
            $this->walletService->debit($transaction->buyer_id, (float) $transaction->gross_amount, $transaction->id, 'Payment to seller');
            
            // Credit seller net amount
            $this->walletService->credit($transaction->seller_id, (float) $transaction->net_amount, $transaction->id, 'Auction payout');
            
            // Commission goes to platform (system account omitted for brevity, but fee is represented by the difference)

            $transaction->update(['escrow_released_at' => now()]);
            
            event(new EscrowReleased($transaction));
            
            ProcessSellerPayoutJob::dispatch($transaction);
        });

        return $transaction;
    }
}
