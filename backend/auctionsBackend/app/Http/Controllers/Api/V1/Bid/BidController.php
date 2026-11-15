<?php

namespace App\Http\Controllers\Api\V1\Bid;

use App\Contracts\Bid\IBidService;
use App\Contracts\Bid\IBidRepository;
use App\DTOs\Bid\PlaceBidDTO;
use App\DTOs\Bid\SetProxyBidDTO;
use App\Enums\BidType;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Bid\PlaceBidRequest;
use App\Http\Requests\Bid\SetProxyBidRequest;
use App\Models\Auction;
use Illuminate\Http\JsonResponse;

class BidController extends Controller
{
    public function __construct(
        protected readonly IBidService $bidService,
        protected readonly IBidRepository $bidRepository,
    ) {}

    /**
     * POST /api/v1/auctions/{auction}/bids
     */
    public function store(PlaceBidRequest $request, Auction $auction): JsonResponse
    {
        $dto = new PlaceBidDTO(
            auctionUuid: $auction->uuid,
            bidderId: $request->user()->id,
            amount: (float) $request->validated('amount'),
            type: BidType::tryFrom($request->validated('type', 'manual')) ?? BidType::Manual,
            ipAddress: $request->ip(),
            deviceFingerprint: $request->validated('device_fingerprint'),
        );

        $result = $this->bidService->placeBid($dto);

        return ApiResponse::success([
            'id' => 0,
            'uuid' => $result->bidUuid,
            'bid_uuid' => $result->bidUuid,
            'auctionUuid' => $auction->uuid,
            'auction_uuid' => $auction->uuid,
            'amount' => $result->amount,
            'bidderAlias' => 'You',
            'bidType' => $dto->type->value,
            'isWinning' => $result->isWinning,
            'is_winning' => $result->isWinning,
            'currentPrice' => $result->currentPrice,
            'current_price' => $result->currentPrice,
            'totalBids' => $result->totalBids,
            'total_bids' => $result->totalBids,
            'isReserveMet' => $result->isReserveMet,
            'is_reserve_met' => $result->isReserveMet,
            'nextMinimumBid' => $result->nextMinimumBid,
            'next_minimum_bid' => $result->nextMinimumBid,
            'timeRemainingSeconds' => $result->timeRemainingSeconds,
            'time_remaining_seconds' => $result->timeRemainingSeconds,
            'createdAt' => now()->toIso8601String(),
        ], 'Bid placed successfully', 201);
    }

    /**
     * GET /api/v1/auctions/{auction}/bids
     */
    public function index(Auction $auction): JsonResponse
    {
        $bids = $this->bidRepository->paginateForAuction($auction->id);

        $formatted = collect($bids->items())->map(fn ($bid) => [
            'id' => $bid->id,
            'uuid' => $bid->uuid,
            'auctionUuid' => $auction->uuid,
            'auction_uuid' => $auction->uuid,
            'amount' => (float) $bid->amount,
            'bidderAlias' => 'Bidder ***' . substr((string) $bid->bidder_id, -2),
            'bidder_alias' => 'Bidder ***' . substr((string) $bid->bidder_id, -2),
            'bidType' => $bid->type?->value ?? (string) $bid->type,
            'bid_type' => $bid->type?->value ?? (string) $bid->type,
            'isWinning' => (bool) $bid->is_winning,
            'is_winning' => (bool) $bid->is_winning,
            'createdAt' => $bid->created_at?->toIso8601String(),
            'created_at' => $bid->created_at?->toIso8601String(),
        ])->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage(),
                'per_page' => $bids->perPage(),
                'total' => $bids->total(),
            ],
            'Bids retrieved'
        );
    }

    /**
     * GET /api/v1/auctions/{auction}/proxy-bids/current
     */
    public function currentProxy(Auction $auction): JsonResponse
    {
        $user = request()->user();
        $proxy = \App\Models\ProxyBid::where('auction_id', $auction->id)
            ->where('bidder_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$proxy) {
            return ApiResponse::success(null, 'No active proxy bid');
        }

        try {
            $maxAmount = (float) \Illuminate\Support\Facades\Crypt::decryptString($proxy->max_amount_encrypted);
        } catch (\Throwable) {
            $maxAmount = 0.0;
        }

        return ApiResponse::success([
            'id' => $proxy->id,
            'uuid' => $proxy->uuid,
            'auctionUuid' => $auction->uuid,
            'maxAmount' => $maxAmount,
            'currentAutoBid' => (float) $auction->current_price,
            'isActive' => (bool) $proxy->is_active,
            'createdAt' => $proxy->created_at?->toIso8601String(),
        ]);
    }

    /**
     * POST /api/v1/auctions/{auction}/proxy-bids
     */
    public function storeProxy(SetProxyBidRequest $request, Auction $auction): JsonResponse
    {
        $maxAmount = (float) $request->validated('max_amount');
        $dto = new SetProxyBidDTO(
            auctionUuid: $auction->uuid,
            bidderId: $request->user()->id,
            maxAmount: $maxAmount,
        );

        $proxy = $this->bidService->setProxyBid($dto);

        return ApiResponse::success([
            'id' => $proxy->id,
            'uuid' => $proxy->uuid,
            'auctionUuid' => $auction->uuid,
            'maxAmount' => $maxAmount,
            'currentAutoBid' => (float) $auction->fresh()->current_price,
            'isActive' => (bool) $proxy->is_active,
            'is_active' => (bool) $proxy->is_active,
            'createdAt' => $proxy->created_at?->toIso8601String(),
        ], 'Proxy bid set', 201);
    }

    /**
     * DELETE /api/v1/auctions/{auction}/proxy-bids
     */
    public function destroyProxy(Auction $auction): JsonResponse
    {
        $this->bidService->cancelProxyBid($auction->uuid, request()->user()->id);

        return ApiResponse::success([], 'Proxy bid cancelled');
    }
}
