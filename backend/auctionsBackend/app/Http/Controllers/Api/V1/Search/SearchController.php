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

        $results = $this->searchService->search($dto, $isAuthenticated);

        return ApiResponse::success($results);
    }

    public function autocomplete(Request $request): JsonResponse
    {
        $q = $request->input('q', '');
        $results = $this->searchService->autocomplete($q);

        return ApiResponse::success(['suggestions' => $results]);
    }
}
