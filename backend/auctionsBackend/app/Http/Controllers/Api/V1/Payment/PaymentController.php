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
}
