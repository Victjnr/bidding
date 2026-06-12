<?php

namespace App\Services\Payment;

use App\Contracts\Payment\IDisputeEvidenceRepository;
use App\Contracts\Payment\IDisputeRepository;
use App\Contracts\Payment\IDisputeService;
use App\Contracts\Payment\ITransactionRepository;
use App\DTOs\Payment\OpenDisputeDTO;
use App\DTOs\Payment\ResolveDisputeDTO;
use App\Enums\DisputeStatus;
use App\Enums\TransactionStatus;
use App\Events\Payment\DisputeOpened;
use App\Events\Payment\DisputeResolved;
use App\Jobs\Payment\ScanDisputeEvidenceJob;
use App\Models\Dispute;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class DisputeService implements IDisputeService
{
    public function __construct(
        protected readonly IDisputeRepository $disputeRepository,
        protected readonly IDisputeEvidenceRepository $evidenceRepository,
        protected readonly ITransactionRepository $transactionRepository,
    ) {}

    public function openDispute(OpenDisputeDTO $dto): Dispute
    {
        $transaction = Transaction::where('uuid', $dto->transactionUuid)->firstOrFail();

        // Validate within dispute window (7 days after buyer confirmed) - assuming here buyer hasn't confirmed if opening dispute.
        // If escrow is released, dispute window is closed.
        if ($transaction->escrow_released_at !== null) {
            throw new InvalidArgumentException('Escrow has already been released. Dispute window expired.');
        }

        // Validate no existing open dispute
        $existing = $this->disputeRepository->findOpenForTransaction($transaction->id);
        if ($existing) {
            throw new InvalidArgumentException('An open dispute already exists for this transaction.');
        }

        return DB::transaction(function () use ($dto, $transaction) {
            $dispute = $this->disputeRepository->create([
                'transaction_id' => $transaction->id,
                'opened_by_user_id' => $dto->openedByUserId,
                'reason' => $dto->reason,
                'status' => DisputeStatus::Open,
                'description' => $dto->description,
            ]);

            $this->transactionRepository->updateStatus($transaction->uuid, TransactionStatus::Disputed->value);

            event(new DisputeOpened($dispute));

            return $dispute;
        });
    }

    public function uploadEvidence(string $disputeUuid, int $userId, array $files): array
    {
        $dispute = Dispute::where('uuid', $disputeUuid)->firstOrFail();
        $transaction = $dispute->transaction;

        if ($transaction->buyer_id !== $userId && $transaction->seller_id !== $userId) {
            throw new InvalidArgumentException('Only the buyer or seller can upload evidence.');
        }

        $evidenceRecords = [];

        foreach ($files as $file) {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            // Storing to local cPanel disk as per user requirement
            $path = $file->storeAs('disputes/' . $dispute->uuid, $filename, 'local');

            $evidence = $this->evidenceRepository->create([
                'dispute_id' => $dispute->id,
                'uploaded_by_user_id' => $userId,
                'file_path' => $path,
                'mime_type' => $file->getMimeType(),
                'original_filename' => $file->getClientOriginalName(),
                'is_scanned' => false,
                'is_safe' => false,
            ]);

            $evidenceRecords[] = $evidence;

            // Dispatch ClamAV scanning job
            ScanDisputeEvidenceJob::dispatch($evidence->id);
        }

        return $evidenceRecords;
    }

    public function resolve(ResolveDisputeDTO $dto): Dispute
    {
        $dispute = Dispute::where('uuid', $dto->disputeUuid)->firstOrFail();

        if ($dispute->status === DisputeStatus::ResolvedBuyer || $dispute->status === DisputeStatus::ResolvedSeller) {
            return $dispute; // Idempotent
        }

        $status = DisputeStatus::tryFrom($dto->resolution);
        if (!$status || !in_array($status, [DisputeStatus::ResolvedBuyer, DisputeStatus::ResolvedSeller])) {
            throw new InvalidArgumentException('Invalid resolution status.');
        }

        DB::transaction(function () use ($dispute, $status, $dto) {
            $dispute->update([
                'status' => $status,
                'resolved_at' => now(),
                'resolution_notes' => $dto->resolutionNotes,
            ]);

            $transaction = $dispute->transaction;

            if ($status === DisputeStatus::ResolvedBuyer) {
                // Refund buyer
                $provider = PaymentProviderFactory::make('stripe');
                if ($transaction->provider_transaction_id) {
                    $provider->refund($transaction->provider_transaction_id, (float) $transaction->gross_amount);
                }
                $this->transactionRepository->updateStatus($transaction->uuid, TransactionStatus::Refunded->value);
                
                // Reverse escrow hold
                app(\App\Contracts\Payment\IWalletService::class)->release($transaction->buyer_id, (float) $transaction->gross_amount, $transaction->id, 'Dispute refund');
                app(\App\Contracts\Payment\IWalletService::class)->debit($transaction->buyer_id, (float) $transaction->gross_amount, $transaction->id, 'Dispute refund to card');
                
            } else {
                // Resolved for seller -> release escrow to seller
                $this->transactionRepository->updateStatus($transaction->uuid, TransactionStatus::Completed->value);
                app(\App\Contracts\Payment\IPaymentService::class)->releaseEscrow(
                    new \App\DTOs\Payment\ReleaseEscrowDTO($transaction->uuid, $dto->resolvedByUserId)
                );
            }

            event(new DisputeResolved($dispute));
        });

        return $dispute;
    }
}
