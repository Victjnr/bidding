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
            'bid_uuid' => $result->bidUuid,
            'amount' => $result->amount,
            'is_winning' => $result->isWinning,
            'current_price' => $result->currentPrice,
            'total_bids' => $result->totalBids,
            'is_reserve_met' => $result->isReserveMet,
            'next_minimum_bid' => $result->nextMinimumBid,
            'time_remaining_seconds' => $result->timeRemainingSeconds,
        ], 'Bid placed successfully', 201);
    }

    /**
     * GET /api/v1/auctions/{auction}/bids
     */
    public function index(Auction $auction): JsonResponse
    {
        $bids = $this->bidRepository->paginateForAuction($auction->id);

        return ApiResponse::success($bids->toArray(), 'Bids retrieved');
    }

    /**
     * POST /api/v1/auctions/{auction}/proxy-bids
     */
    public function storeProxy(SetProxyBidRequest $request, Auction $auction): JsonResponse
    {
        $dto = new SetProxyBidDTO(
            auctionUuid: $auction->uuid,
            bidderId: $request->user()->id,
            maxAmount: (float) $request->validated('max_amount'),
        );

        $proxy = $this->bidService->setProxyBid($dto);

        return ApiResponse::success([
            'uuid' => $proxy->uuid,
            'is_active' => $proxy->is_active,
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
