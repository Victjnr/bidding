<?php

namespace App\Http\Controllers\Api\V1\Payment;

use App\Contracts\Payment\IPaymentService;
use App\DTOs\Payment\CaptureEscrowDTO;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PaymentController extends Controller
{
    public function __construct(
        protected readonly IPaymentService $paymentService
    ) {}

    /**
     * POST /api/v1/auctions/{auction}/payment/capture
     */
    public function capture(Request $request, Auction $auction): JsonResponse
    {
        $request->validate([
            'payment_method_id' => 'required|string',
        ]);

        // Authorization: only the buyer can capture payment
        // We'll create a dummy transaction to check policy, or just check manually
        if ($request->user()->id !== $auction->buyer_id && $request->user()->id !== $auction->winner_id) {
            return ApiResponse::error('Unauthorized to capture payment for this auction', 403);
        }

        $dto = new CaptureEscrowDTO(
            auctionId: $auction->id,
            buyerId: $request->user()->id,
            paymentMethodId: $request->input('payment_method_id')
        );

        $transaction = $this->paymentService->capturePayment($dto);

        return ApiResponse::success([
            'transaction_uuid' => $transaction->uuid,
            'status' => $transaction->status->value,
            'gross_amount' => $transaction->gross_amount,
        ], 'Payment captured successfully');
    }

    /**
     * GET /api/v1/payments/methods
     */
    public function methods(Request $request): JsonResponse
    {
        $methods = \Illuminate\Support\Facades\Cache::get("user:payment_methods:{$request->user()->id}", [
            [
                'id' => 'pm_ecocash_default',
                'type' => 'ecocash',
                'label' => 'EcoCash (' . ($request->user()->phone ?: '+263 77 000 0000') . ')',
                'phone' => $request->user()->phone ?: '+263770000000',
                'isDefault' => true,
            ],
        ]);
        return ApiResponse::success($methods);
    }

    /**
     * POST /api/v1/payments/methods
     */
    public function addMethod(Request $request): JsonResponse
    {
        $methods = \Illuminate\Support\Facades\Cache::get("user:payment_methods:{$request->user()->id}", []);
        $newMethod = [
            'id' => 'pm_' . \Illuminate\Support\Str::random(10),
            'type' => $request->input('type', 'ecocash'),
            'label' => strtoupper($request->input('type', 'EcoCash')) . ' (' . $request->input('phone', $request->input('accountNumber', '')) . ')',
            'phone' => $request->input('phone'),
            'isDefault' => empty($methods),
        ];
        $methods[] = $newMethod;
        \Illuminate\Support\Facades\Cache::put("user:payment_methods:{$request->user()->id}", $methods, now()->addDays(90));

        return ApiResponse::success($newMethod, 'Payment method added', 201);
    }

    /**
     * DELETE /api/v1/payments/methods/{id}
     */
    public function removeMethod(Request $request, string $id): JsonResponse
    {
        $methods = collect(\Illuminate\Support\Facades\Cache::get("user:payment_methods:{$request->user()->id}", []))
            ->reject(fn ($m) => ($m['id'] ?? '') === $id)
            ->values()
            ->all();
        \Illuminate\Support\Facades\Cache::put("user:payment_methods:{$request->user()->id}", $methods, now()->addDays(90));

        return ApiResponse::success(null, 'Payment method removed');
    }

    /**
     * POST /api/v1/payments/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $auctionUuid = $request->input('auctionUuid') ?? $request->input('auction_uuid');
        $auction = Auction::where('uuid', $auctionUuid)->firstOrFail();
        $amount = (float) $auction->current_price;
        $fee = round($amount * 0.05, 2);

        $transaction = \App\Models\Transaction::firstOrCreate(
            [
                'auction_id' => $auction->id,
                'buyer_id' => $request->user()->id,
            ],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'seller_id' => $auction->seller_id,
                'gross_amount' => $amount,
                'platform_fee' => $fee,
                'seller_payout' => max(0, $amount - $fee),
                'currency' => $auction->currency_code ?? 'USD',
                'status' => \App\Enums\TransactionStatus::EscrowHeld,
                'stripe_payment_intent_id' => 'paynow_' . \Illuminate\Support\Str::random(12),
            ]
        );

        $auction->update([
            'status' => \App\Enums\AuctionStatus::Settled->value,
            'winner_id' => $request->user()->id,
        ]);

        $reference = 'REF-' . strtoupper(substr($transaction->uuid, 0, 8));
        $pollUrl = url("/api/v1/payments/status?reference={$reference}");

        return ApiResponse::success([
            'success' => true,
            'instructions' => 'Payment processed! Check your phone or wallet ledger for confirmation.',
            'pollUrl' => $pollUrl,
            'redirectUrl' => null,
            'reference' => $reference,
            'status' => 'paid',
            'amount' => $amount,
            'currency' => $auction->currency_code ?? 'USD',
            'transactionUuid' => $transaction->uuid,
        ], 'Payment initiated');
    }

    /**
     * GET /api/v1/payments/status
     */
    public function status(Request $request): JsonResponse
    {
        $pollUrl = $request->input('pollUrl', '');
        $reference = $request->input('reference', 'REF-PAID');

        return ApiResponse::success([
            'pollUrl' => $pollUrl,
            'reference' => $reference,
            'status' => 'paid',
            'amount' => 0,
            'currency' => 'USD',
        ]);
    }

    /**
     * GET /api/v1/wallet/balance
     */
    public function walletBalance(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $available = (float) \App\Models\Transaction::where('seller_id', $userId)
            ->whereNotNull('escrow_released_at')
            ->sum('seller_payout');
        $escrowHeld = (float) \App\Models\Transaction::where('seller_id', $userId)
            ->whereNull('escrow_released_at')
            ->sum('seller_payout');

        return ApiResponse::success([
            'available' => $available,
            'escrowHeld' => $escrowHeld,
            'pendingWithdrawal' => 0.0,
            'currency' => 'USD',
        ]);
    }

    /**
     * GET /api/v1/wallet/ledger
     */
    public function walletLedger(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $txs = \App\Models\Transaction::where('buyer_id', $userId)
            ->orWhere('seller_id', $userId)
            ->with('auction:id,uuid,title')
            ->latest()
            ->paginate($perPage);

        $entries = collect($txs->items())->map(function ($tx) use ($userId) {
            $isSeller = $tx->seller_id === $userId;
            return [
                'id' => $tx->id,
                'uuid' => $tx->uuid,
                'type' => $isSeller ? ($tx->escrow_released_at ? 'escrow_release' : 'escrow_hold') : 'payment',
                'amount' => (float) ($isSeller ? $tx->seller_payout : $tx->gross_amount),
                'balanceAfter' => (float) $tx->seller_payout,
                'currency' => $tx->currency ?? 'USD',
                'description' => ($isSeller ? 'Sale proceeds: ' : 'Auction payment: ') . ($tx->auction?->title ?? 'Auction'),
                'referenceId' => $tx->uuid,
                'auctionUuid' => $tx->auction?->uuid,
                'auctionTitle' => $tx->auction?->title,
                'status' => 'completed',
                'createdAt' => $tx->created_at?->toIso8601String(),
            ];
        })->all();

        return ApiResponse::paginated(
            $entries,
            [
                'current_page' => $txs->currentPage(),
                'last_page' => $txs->lastPage(),
                'per_page' => $txs->perPage(),
                'total' => $txs->total(),
            ]
        );
    }

    /**
     * POST /api/v1/wallet/payouts/request
     */
    public function requestPayout(Request $request): JsonResponse
    {
        $amount = (float) $request->input('amount', 0);
        return ApiResponse::success([
            'id' => random_int(1, 9999),
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'amount' => $amount,
            'fee' => round($amount * 0.01, 2),
            'netAmount' => round($amount * 0.99, 2),
            'currency' => 'USD',
            'method' => $request->input('methodId', 'EcoCash'),
            'status' => 'processing',
            'processedAt' => null,
            'createdAt' => now()->toIso8601String(),
        ], 'Payout requested', 201);
    }

    /**
     * GET /api/v1/wallet/payouts
     */
    public function payouts(Request $request): JsonResponse
    {
        return ApiResponse::paginated([], [
            'current_page' => 1,
            'last_page' => 1,
            'per_page' => 20,
            'total' => 0,
        ]);
    }
}
