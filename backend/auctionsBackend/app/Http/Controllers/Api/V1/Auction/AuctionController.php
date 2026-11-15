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
    public function index(Request $request): JsonResponse
    {
        $query = Auction::query()->with(['seller', 'category', 'media']);

        $status = $request->input('status') ?? $request->input('filter.status');
        if ($status) {
            $query->where('status', $status);
        } else {
            $query->where('status', \App\Enums\AuctionStatus::Active->value);
        }

        $search = $request->input('search') ?? $request->input('q');
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $category = $request->input('category') ?? $request->input('categoryId') ?? $request->input('filter.category_id');
        if ($category) {
            if (is_numeric($category)) {
                $query->where('category_id', (int) $category);
            } else {
                $query->whereHas('category', fn ($q) => $q->where('slug', $category));
            }
        }

        $type = $request->input('type') ?? $request->input('auctionType') ?? $request->input('filter.auction_type');
        if ($type) {
            $query->where('auction_type', $type);
        }

        $condition = $request->input('condition') ?? $request->input('filter.condition');
        if ($condition) {
            $query->where('condition', $condition);
        }

        $minPrice = $request->input('minPrice') ?? $request->input('price_min') ?? $request->input('filter.price_min');
        if ($minPrice !== null && $minPrice !== '') {
            $query->where('current_price', '>=', (float) $minPrice);
        }

        $maxPrice = $request->input('maxPrice') ?? $request->input('price_max') ?? $request->input('filter.price_max');
        if ($maxPrice !== null && $maxPrice !== '') {
            $query->where('current_price', '<=', (float) $maxPrice);
        }

        $sort = $request->input('sort', 'ending_soon');
        switch ($sort) {
            case 'price_asc':
            case 'current_price':
                $query->orderBy('current_price', 'asc');
                break;
            case 'price_desc':
            case '-current_price':
                $query->orderBy('current_price', 'desc');
                break;
            case 'most_bids':
            case '-total_bids':
                $query->orderBy('total_bids', 'desc');
                break;
            case 'newest':
            case '-created_at':
                $query->orderBy('created_at', 'desc');
                break;
            case 'ending_soon':
            case 'end_at':
            default:
                $query->orderBy('end_at', 'asc');
                break;
        }

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $auctions = $query->paginate($perPage);

        return ApiResponse::paginated(
            AuctionResource::collection($auctions->items())->resolve(),
            [
                'current_page' => $auctions->currentPage(),
                'last_page' => $auctions->lastPage(),
                'per_page' => $auctions->perPage(),
                'total' => $auctions->total(),
            ],
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
            title: (string) $request->validated('title'),
            description: (string) $request->validated('description'),
            auctionType: AuctionType::from($request->validated('auction_type')),
            categoryId: (int) $request->validated('category_id'),
            condition: (string) $request->validated('condition'),
            locationCountry: (string) $request->validated('location_country'),
            locationCity: (string) $request->validated('location_city'),
            currencyCode: (string) $request->validated('currency_code'),
            startPrice: (float) $request->validated('start_price'),
            reservePrice: $request->validated('reserve_price') !== null ? (float) $request->validated('reserve_price') : null,
            binPrice: $request->validated('bin_price') !== null ? (float) $request->validated('bin_price') : null,
            bidIncrementType: (string) $request->validated('bid_increment_type'),
            bidIncrementValue: (float) $request->validated('bid_increment_value'),
            depositRequired: (bool) $request->validated('deposit_required'),
            depositAmount: $request->validated('deposit_amount') !== null ? (float) $request->validated('deposit_amount') : null,
            startAt: Carbon::parse($request->validated('start_at')),
            endAt: Carbon::parse($request->validated('end_at')),
            antiSnipeMinutes: (int) $request->validated('anti_snipe_minutes'),
            antiSnipeExtendMinutes: (int) $request->validated('anti_snipe_extend_minutes'),
            maxExtensionMinutes: (int) $request->validated('max_extension_minutes'),
        );

        $auction = $this->auctionService->create($dto, $request->user());

        \App\Models\AuditLog::create([
            'actor_id' => $request->user()?->id,
            'action' => 'auction.created',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => null,
            'new_values' => [
                'uuid' => $auction->uuid,
                'title' => $auction->title,
                'start_price' => $auction->start_price,
                'status' => $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status,
            ],
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'user_agent' => $request->userAgent() ?? 'Web Browser',
        ]);

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

        $files = $request->file('files')
            ?? $request->file('media')
            ?? ($request->hasFile('file') ? [$request->file('file')] : []);
        if (empty($files)) {
            return ApiResponse::error('No files uploaded', 422);
        }

        $dto = new MediaUploadDTO(
            auctionId: $auction->uuid,
            files: $files,
            isPrimary: (bool) $request->validated('is_primary', false)
        );

        $uploaded = $this->auctionService->uploadMedia($dto);

        return ApiResponse::success(
            \App\Http\Resources\Auction\AuctionMediaResource::collection($uploaded)->resolve(),
            'Media uploaded',
            201
        );
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

        $oldStatus = $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status;
        $auction = $this->auctionService->submitForReview($auction, request()->user());

        \App\Models\AuditLog::create([
            'actor_id' => request()->user()?->id,
            'action' => 'auction.submitted',
            'subject_type' => Auction::class,
            'subject_id' => $auction->id,
            'old_values' => ['status' => $oldStatus],
            'new_values' => [
                'uuid' => $auction->uuid,
                'title' => $auction->title,
                'status' => $auction->status instanceof \BackedEnum ? $auction->status->value : (string) $auction->status,
            ],
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'Web Browser',
        ]);

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
        $watchersCount = $auction->watchers()->count();

        return ApiResponse::success(
            [
                'isWatched' => $isWatching,
                'is_watching' => $isWatching,
                'watchersCount' => $watchersCount,
                'watchers_count' => $watchersCount,
            ],
            $isWatching ? 'Auction added to watchlist' : 'Auction removed from watchlist'
        );
    }
}
