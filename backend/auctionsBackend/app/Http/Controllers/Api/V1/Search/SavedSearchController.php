<?php

namespace App\Http\Controllers\Api\V1\Search;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\SavedSearch;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SavedSearchController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $searches = $request->user()->savedSearches()->get();
        return ApiResponse::success($searches);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'filters' => 'required|array',
            'frequency' => 'required|string|in:daily,real-time',
        ]);

        $search = $request->user()->savedSearches()->create([
            'name' => $request->input('name'),
            'filters' => $request->input('filters'),
            'frequency' => $request->input('frequency'),
        ]);

        return ApiResponse::success($search, 'Saved search created', 201);
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $search = $request->user()->savedSearches()->where('uuid', $uuid)->firstOrFail();
        $search->delete();

        return ApiResponse::success(null, 'Saved search deleted');
    }
}
