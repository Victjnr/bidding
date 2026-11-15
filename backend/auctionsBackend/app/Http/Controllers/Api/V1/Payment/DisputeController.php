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
     * GET /api/v1/disputes
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $disputes = Dispute::where('opened_by', $userId)
            ->orWhereHas('transaction', fn ($q) => $q->where('buyer_id', $userId)->orWhere('seller_id', $userId))
            ->with(['transaction.auction', 'evidence'])
            ->latest()
            ->paginate($perPage);

        $formatted = collect($disputes->items())->map(fn ($d) => $this->formatDispute($d))->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $disputes->currentPage(),
                'last_page' => $disputes->lastPage(),
                'per_page' => $disputes->perPage(),
                'total' => $disputes->total(),
            ]
        );
    }

    /**
     * GET /api/v1/disputes/{dispute}
     */
    public function show(Request $request, Dispute $dispute): JsonResponse
    {
        $dispute->load(['transaction.auction', 'evidence']);
        return ApiResponse::success($this->formatDispute($dispute));
    }

    /**
     * POST /api/v1/disputes
     */
    public function createFromAuction(Request $request): JsonResponse
    {
        $auctionUuid = $request->input('auctionUuid') ?? $request->input('auction_uuid');
        $auction = \App\Models\Auction::where('uuid', $auctionUuid)->firstOrFail();

        $transaction = Transaction::firstOrCreate(
            [
                'auction_id' => $auction->id,
                'buyer_id' => $request->user()->id,
            ],
            [
                'uuid' => (string) \Illuminate\Support\Str::uuid(),
                'seller_id' => $auction->seller_id,
                'gross_amount' => (float) $auction->current_price,
                'platform_fee' => round((float) $auction->current_price * 0.05, 2),
                'seller_payout' => round((float) $auction->current_price * 0.95, 2),
                'currency' => $auction->currency_code ?? 'USD',
                'status' => \App\Enums\TransactionStatus::Disputed,
            ]
        );

        $reasonStr = $request->input('reason', 'item_not_received');
        $reason = DisputeReason::tryFrom($reasonStr) ?? DisputeReason::cases()[0];

        $dto = new OpenDisputeDTO(
            transactionUuid: $transaction->uuid,
            openedByUserId: $request->user()->id,
            reason: $reason,
            description: $request->input('description', 'Dispute opened')
        );

        $dispute = $this->disputeService->openDispute($dto);
        $dispute->load(['transaction.auction', 'evidence']);

        return ApiResponse::success($this->formatDispute($dispute), 'Dispute opened', 201);
    }

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
        $files = $request->file('files') ?? ($request->hasFile('file') ? [$request->file('file')] : []);
        if (empty($files)) {
            return ApiResponse::error('No evidence file uploaded', 422);
        }

        $evidence = $this->disputeService->uploadEvidence(
            $dispute->uuid,
            $request->user()->id,
            $files
        );

        return ApiResponse::success([
            'uploaded_count' => count($evidence),
        ], 'Evidence uploaded successfully');
    }

    private function formatDispute(Dispute $d): array
    {
        $tx = $d->transaction;
        $auction = $tx?->auction;
        return [
            'id' => $d->id,
            'uuid' => $d->uuid,
            'auctionUuid' => $auction?->uuid ?? '',
            'auctionTitle' => $auction?->title ?? 'Auction',
            'reason' => $d->reason?->value ?? (string) $d->reason,
            'description' => $d->description,
            'status' => $d->status?->value ?? (string) $d->status,
            'amount' => (float) ($tx?->gross_amount ?? 0),
            'currency' => $tx?->currency ?? 'USD',
            'evidence' => collect($d->evidence ?? [])->map(fn ($e) => [
                'id' => $e->id,
                'type' => 'document',
                'url' => $e->file_path ?? '',
                'description' => 'Evidence document',
                'uploadedAt' => $e->created_at?->toIso8601String(),
            ])->all(),
            'resolution' => $d->resolution_notes,
            'createdAt' => $d->created_at?->toIso8601String(),
            'resolvedAt' => $d->resolved_at?->toIso8601String(),
        ];
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
