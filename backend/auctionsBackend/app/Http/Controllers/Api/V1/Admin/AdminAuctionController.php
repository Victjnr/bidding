<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Contracts\Auction\IAuctionService;
use App\DTOs\Auction\ApproveAuctionDTO;
use App\Enums\AuctionStatus;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\Auction\AuctionResource;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuctionController extends Controller
{
    public function __construct(protected readonly IAuctionService $auctionService)
    {}

    /**
     * GET /api/v1/admin/auctions/pending
     */
    public function pendingQueue(): JsonResponse
    {
        $this->authorize('approve', Auction::class);

        $pending = Auction::where('status', AuctionStatus::Pending)
            ->with(['seller', 'media'])
            ->orderBy('created_at', 'asc')
            ->paginate(20);

        return ApiResponse::success(
            AuctionResource::collection($pending)->response()->getData(true),
            'Pending auctions retrieved'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/approve
     */
    public function approve(Request $request, Auction $auction): JsonResponse
    {
        $this->authorize('approve', $auction);

        $dto = new ApproveAuctionDTO(
            approvedByUserId: $request->user()->uuid
        );

        $auction = $this->auctionService->approve($auction, $dto);

        return ApiResponse::success(
            new AuctionResource($auction),
            'Auction approved'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/reject
     */
    public function reject(Auction $auction): JsonResponse
    {
        $this->authorize('approve', $auction);

        // Transition Pending → Draft (rejection)
        $auction->update(['status' => AuctionStatus::Draft->value]);

        return ApiResponse::success(
            new AuctionResource($auction->fresh()),
            'Auction rejected'
        );
    }

    /**
     * POST /api/v1/admin/auctions/{uuid}/close
     */
    public function forceClose(Auction $auction): JsonResponse
    {
        $this->authorize('forceClose', $auction);

        $this->auctionService->close($auction);

        return ApiResponse::success(
            new AuctionResource($auction->fresh()),
            'Auction force-closed'
        );
    }
}
