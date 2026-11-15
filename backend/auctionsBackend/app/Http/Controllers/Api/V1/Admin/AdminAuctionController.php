<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Auction\IAuctionService;
use App\DTOs\Auction\ApproveAuctionDTO;
use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminPendingAuctionResource;
use App\Http\Resources\Auction\AuctionResource;
use App\Models\Auction;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuctionController extends Controller
{
    public function __construct(protected readonly IAuctionService $auctionService)
    {}

    /**
     * GET /api/v1/admin/auctions
     */
    public function pendingQueue(Request $request): JsonResponse
    {
        $this->authorize('approve', Auction::class);

        $statusQuery = $request->query('status', 'pending');

        $statuses = match ($statusQuery) {
            'active', 'approved' => [
                AuctionStatus::Scheduled->value,
                AuctionStatus::Active->value,
                AuctionStatus::Extended->value,
                AuctionStatus::Closing->value,
            ],
            'flagged', 'rejected' => [
                AuctionStatus::Disputed->value,
                AuctionStatus::Cancelled->value,
            ],
            'ended' => [
                AuctionStatus::Ended->value,
                AuctionStatus::Sold->value,
                AuctionStatus::NoSale->value,
            ],
            'changes_requested' => [
                AuctionStatus::Draft->value,
            ],
            default => [
                AuctionStatus::Pending->value,
                AuctionStatus::Draft->value,
            ],
        };

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $pending = Auction::whereIn('status', $statuses)
            ->with(['seller', 'media', 'category'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);

        return ApiResponse::paginated(
            AdminPendingAuctionResource::collection($pending->items())->resolve(),
            [
                'current_page' => $pending->currentPage(),
                'last_page' => $pending->lastPage(),
                'per_page' => $pending->perPage(),
                'total' => $pending->total(),
            ],
            'Auctions retrieved'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/approve
     */
    public function approve(Request $request, Auction $auction): JsonResponse
    {
        $this->authorize('approve', $auction);

        $oldStatus = $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status;

        $dto = new ApproveAuctionDTO(
            approvedByUserId: $request->user()->uuid
        );

        $auction = $this->auctionService->approve($auction, $dto);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'auction.approved',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success(
            new AuctionResource($auction->load(['seller', 'media', 'category'])),
            'Auction approved and published live'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/reject
     */
    public function reject(Request $request, Auction $auction): JsonResponse
    {
        $this->authorize('approve', $auction);

        $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status;
        $reason = $request->input('reason', 'Rejected by administrator');

        $auction->update(['status' => AuctionStatus::Cancelled->value]);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'auction.rejected',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => AuctionStatus::Cancelled->value, 'reason' => $reason],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success(
            new AuctionResource($auction->fresh(['seller', 'media', 'category'])),
            'Auction rejected'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/request-changes
     */
    public function requestChanges(Request $request, Auction $auction): JsonResponse
    {
        $this->authorize('approve', $auction);

        $oldStatus = $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status;
        $notes = $request->input('notes', 'Changes requested by moderator');

        $auction->update(['status' => AuctionStatus::Draft->value]);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'auction.changes_requested',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => AuctionStatus::Draft->value, 'notes' => $notes],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success(
            new AuctionResource($auction->fresh(['seller', 'media', 'category'])),
            'Changes requested'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/close
     */
    public function forceClose(Request $request, Auction $auction): JsonResponse
    {
        $this->authorize('forceClose', $auction);

        $oldStatus = $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status;

        $this->auctionService->close($auction);

        AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'auction.force_closed',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => ['status' => $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Admin Web UI',
        ]);

        return ApiResponse::success(
            new AuctionResource($auction->fresh(['seller', 'media', 'category'])),
            'Auction force-closed'
        );
    }
}
