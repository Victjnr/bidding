<?php

namespace App\Http\Controllers\Api\V1\Search;

use App\Contracts\Search\ISearchService;
use App\DTOs\Search\SearchQueryDTO;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        protected readonly ISearchService $searchService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $dto = SearchQueryDTO::fromRequest($request);
        $isAuthenticated = auth('sanctum')->check();

        $paginator = $this->searchService->search($dto, $isAuthenticated);

        return ApiResponse::paginated(
            \App\Http\Resources\Auction\AuctionResource::collection($paginator->items())->resolve(),
            [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        );
    }

    public function autocomplete(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        $results = $this->searchService->autocomplete($q);

        return ApiResponse::success($results);
    }

    public function facets(Request $request): JsonResponse
    {
        $categories = \App\Models\Category::withCount(['auctions' => fn($q) => $q->where('status', 'active')])
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'slug' => $c->slug,
                'count' => (int) ($c->auctions_count ?? 0),
            ]);

        return ApiResponse::success([
            'categories' => $categories,
            'conditions' => [
                ['condition' => 'new', 'count' => \App\Models\Auction::where('status', 'active')->where('condition', 'new')->count()],
                ['condition' => 'like_new', 'count' => \App\Models\Auction::where('status', 'active')->where('condition', 'like_new')->count()],
                ['condition' => 'good', 'count' => \App\Models\Auction::where('status', 'active')->where('condition', 'good')->count()],
                ['condition' => 'fair', 'count' => \App\Models\Auction::where('status', 'active')->where('condition', 'fair')->count()],
            ],
            'priceRanges' => [
                ['min' => 0, 'max' => 100, 'count' => \App\Models\Auction::where('status', 'active')->whereBetween('current_price', [0, 100])->count()],
                ['min' => 100, 'max' => 1000, 'count' => \App\Models\Auction::where('status', 'active')->whereBetween('current_price', [100, 1000])->count()],
                ['min' => 1000, 'max' => 10000, 'count' => \App\Models\Auction::where('status', 'active')->whereBetween('current_price', [1000, 10000])->count()],
            ],
            'auctionTypes' => [
                ['type' => 'standard', 'count' => \App\Models\Auction::where('status', 'active')->where('auction_type', 'standard')->count()],
                ['type' => 'reserve', 'count' => \App\Models\Auction::where('status', 'active')->where('auction_type', 'reserve')->count()],
                ['type' => 'buy_now', 'count' => \App\Models\Auction::where('status', 'active')->where('auction_type', 'buy_now')->count()],
            ],
        ]);
    }
}
