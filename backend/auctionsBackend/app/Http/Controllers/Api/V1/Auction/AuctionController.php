<?php

namespace App\Http\Controllers\Api\V1\Auction;

use App\Contracts\Auction\IAuctionService;
use App\DTOs\Auction\CreateAuctionDTO;
use App\DTOs\Auction\MediaUploadDTO;
use App\Enums\AuctionType;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auction\AuctionFilterRequest;
use App\Http\Requests\Auction\CreateAuctionRequest;
use App\Http\Requests\Auction\MediaUploadRequest;
use App\Http\Requests\Auction\UpdateAuctionRequest;
use App\Http\Resources\Auction\AuctionResource;
use App\Models\Auction;
use App\Models\AuctionMedia;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class AuctionController extends Controller
{
    public function __construct(protected readonly IAuctionService $auctionService)
    {}

    /**
     * GET /api/v1/auctions
     */
    public function index(AuctionFilterRequest $request): JsonResponse
    {
        $auctions = QueryBuilder::for(Auction::class)
            ->allowedFilters([
                AllowedFilter::exact('category_id'),
                AllowedFilter::exact('auction_type'),
                AllowedFilter::exact('status'),
                AllowedFilter::exact('condition'),
                AllowedFilter::exact('currency_code'),
                AllowedFilter::exact('location_country'),
                AllowedFilter::callback('price_min', fn ($query, $value) =>
                    $query->where('current_price', '>=', $value)
                ),
                AllowedFilter::callback('price_max', fn ($query, $value) =>
                    $query->where('current_price', '<=', $value)
                ),
                AllowedFilter::callback('ending_soon', fn ($query, $value) =>
                    $query->where('end_at', '<=', now()->addHours((int) $value))
                        ->where('end_at', '>=', now())
                ),
            ])
            ->allowedSorts(['end_at', 'current_price', 'total_bids', 'created_at'])
            ->allowedIncludes(['seller', 'category', 'media'])
            ->paginate($request->input('per_page', 20));

        return ApiResponse::success(
            AuctionResource::collection($auctions)->response()->getData(true),
            'Auctions retrieved'
        );
    }

    /**
     * POST /api/v1/auctions
     */
    public function store(CreateAuctionRequest $request): JsonResponse
    {
        $this->authorize('create', Auction::class);

        $dto = new CreateAuctionDTO(
            title: $request->validated('title'),
            description: $request->validated('description'),
            auctionType: AuctionType::from($request->validated('auction_type')),
            categoryId: $request->validated('category_id'),
            condition: $request->validated('condition'),
            locationCountry: $request->validated('location_country'),
            locationCity: $request->validated('location_city'),
            currencyCode: $request->validated('currency_code'),
            startPrice: $request->validated('start_price'),
            reservePrice: $request->validated('reserve_price'),
            binPrice: $request->validated('bin_price'),
            bidIncrementType: $request->validated('bid_increment_type'),
            bidIncrementValue: $request->validated('bid_increment_value'),
            depositRequired: $request->validated('deposit_required'),
            depositAmount: $request->validated('deposit_amount'),
            startAt: Carbon::parse($request->validated('start_at')),
            endAt: Carbon::parse($request->validated('end_at')),
            antiSnipeMinutes: $request->validated('anti_snipe_minutes'),
            antiSnipeExtendMinutes: $request->validated('anti_snipe_extend_minutes'),
            maxExtensionMinutes: $request->validated('max_extension_minutes'),
        );

        $auction = $this->auctionService->create($dto, $request->user());

        return ApiResponse::success(
            new AuctionResource($auction),
            'Auction created',
            201
        );
    }

    /**
     * GET /api/v1/auctions/{uuid}
     */
    public function show(Auction $auction): JsonResponse
    {
        $this->authorize('view', $auction);

        $auction->load(['seller', 'category', 'media']);

        return ApiResponse::success(
            new AuctionResource($auction),
            'Auction retrieved'
        );
    }

    /**
     * PATCH /api/v1/auctions/{uuid}
     */
    public function update(UpdateAuctionRequest $request, Auction $auction): JsonResponse
    {
        $this->authorize('update', $auction);

        $auction->update($request->validated());

        return ApiResponse::success(
            new AuctionResource($auction->fresh()),
            'Auction updated'
        );
    }

    /**
     * DELETE /api/v1/auctions/{uuid}
     */
    public function destroy(Auction $auction): JsonResponse
    {
        $this->authorize('delete', $auction);

        $auction->delete();

        return ApiResponse::success([], 'Auction deleted');
    }

    /**
     * POST /api/v1/auctions/{uuid}/media
     */
    public function uploadMedia(MediaUploadRequest $request, Auction $auction): JsonResponse
    {
        $this->authorize('update', $auction);

        $dto = new MediaUploadDTO(
            auctionId: $auction->uuid,
            files: $request->file('files'),
            isPrimary: (bool) $request->validated('is_primary', false)
        );

        $uploaded = $this->auctionService->uploadMedia($dto);

        return ApiResponse::success($uploaded->toArray(), 'Media uploaded', 201);
    }

    /**
     * DELETE /api/v1/auctions/{uuid}/media/{id}
     */
    public function destroyMedia(Auction $auction, AuctionMedia $media): JsonResponse
    {
        $this->authorize('update', $auction);

        $media->delete();

        return ApiResponse::success([], 'Media deleted');
    }

    /**
     * POST /api/v1/auctions/{uuid}/submit
     */
    public function submitForReview(Auction $auction): JsonResponse
    {
        $this->authorize('update', $auction);

        $auction = $this->auctionService->submitForReview($auction, request()->user());

        return ApiResponse::success(
            new AuctionResource($auction),
            'Auction submitted for review'
        );
    }

    /**
     * POST /api/v1/auctions/{uuid}/watch
     */
    public function toggleWatch(Request $request, Auction $auction): JsonResponse
    {
        // Toggle watch logic — assumes a pivot table auction_watches
        $user = $request->user();
        $watching = $user->watchedAuctions()->toggle($auction->id);
        $isWatching = in_array($auction->id, $watching['attached']);

        return ApiResponse::success(
            ['is_watching' => $isWatching],
            $isWatching ? 'Auction added to watchlist' : 'Auction removed from watchlist'
        );
    }
}
