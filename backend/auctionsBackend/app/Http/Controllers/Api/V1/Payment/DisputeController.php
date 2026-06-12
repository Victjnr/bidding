<?php

namespace App\Http\Controllers\Api\V1\Payment;

use App\Contracts\Payment\IDisputeService;
use App\DTOs\Payment\OpenDisputeDTO;
use App\DTOs\Payment\ResolveDisputeDTO;
use App\Enums\DisputeReason;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Dispute;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

class DisputeController extends Controller
{
    public function __construct(
        protected readonly IDisputeService $disputeService
    ) {}

    /**
     * POST /api/v1/transactions/{transaction}/disputes
     */
    public function store(Request $request, Transaction $transaction): JsonResponse
    {
        $request->validate([
            'reason' => ['required', new Enum(DisputeReason::class)],
            'description' => 'required|string|max:1000',
        ]);

        if ($request->user()->id !== $transaction->buyer_id) {
            return ApiResponse::error('Only the buyer can open a dispute', 403);
        }

        $dto = new OpenDisputeDTO(
            transactionUuid: $transaction->uuid,
            openedByUserId: $request->user()->id,
            reason: DisputeReason::tryFrom($request->input('reason')),
            description: $request->input('description')
        );

        $dispute = $this->disputeService->openDispute($dto);

        return ApiResponse::success([
            'dispute_uuid' => $dispute->uuid,
            'status' => $dispute->status->value,
        ], 'Dispute opened', 201);
    }

    /**
     * POST /api/v1/disputes/{dispute}/evidence
     */
    public function uploadEvidence(Request $request, Dispute $dispute): JsonResponse
    {
        $request->validate([
            'files' => 'required|array',
            'files.*' => 'file|max:10240', // 10MB max per file
        ]);

        $evidence = $this->disputeService->uploadEvidence(
            $dispute->uuid,
            $request->user()->id,
            $request->file('files')
        );

        return ApiResponse::success([
            'uploaded_count' => count($evidence),
        ], 'Evidence uploaded successfully');
    }

    /**
     * POST /api/v1/admin/disputes/{dispute}/resolve
     */
    public function resolve(Request $request, Dispute $dispute): JsonResponse
    {
        // Require admin/moderator
        if (!$request->user()->hasAnyRole(['admin', 'moderator'])) {
            return ApiResponse::error('Unauthorized', 403);
        }

        $request->validate([
            'resolution' => 'required|string|in:resolved_buyer,resolved_seller',
            'resolution_notes' => 'nullable|string',
        ]);

        $dto = new ResolveDisputeDTO(
            disputeUuid: $dispute->uuid,
            resolvedByUserId: $request->user()->id,
            resolution: $request->input('resolution'),
            resolutionNotes: $request->input('resolution_notes')
        );

        $resolved = $this->disputeService->resolve($dto);

        return ApiResponse::success([
            'dispute_uuid' => $resolved->uuid,
            'status' => $resolved->status->value,
        ], 'Dispute resolved');
    }
}
