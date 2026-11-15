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
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $paginator = $request->user()->savedSearches()->latest()->paginate($perPage);
        $searches = collect($paginator->items())->map(fn ($s) => $this->formatSavedSearch($s))->all();

        return ApiResponse::paginated($searches, [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'query' => 'nullable|string|max:255',
            'filters' => 'nullable|array',
            'frequency' => 'nullable|string|in:daily,real-time',
        ]);

        $filters = $request->input('filters', []);
        if ($request->filled('query')) {
            $filters['q'] = $request->input('query');
        }
        $filters['notifyEmail'] = $request->boolean('notifyEmail', true);
        $filters['notifyPush'] = $request->boolean('notifyPush', false);

        $search = $request->user()->savedSearches()->create([
            'name' => $request->input('name'),
            'filters' => $filters,
            'frequency' => $request->input('frequency', 'daily'),
        ]);

        return ApiResponse::success($this->formatSavedSearch($search), 'Saved search created', 201);
    }

    public function destroy(Request $request, string $uuid): JsonResponse
    {
        $search = $request->user()->savedSearches()
            ->where(fn($q) => $q->where('uuid', $uuid)->orWhere('id', is_numeric($uuid) ? (int) $uuid : 0))
            ->firstOrFail();
        $search->delete();

        return ApiResponse::success(null, 'Saved search deleted');
    }

    private function formatSavedSearch(SavedSearch $s): array
    {
        $filters = is_array($s->filters) ? $s->filters : [];
        return [
            'id' => $s->uuid,
            'uuid' => $s->uuid,
            'name' => $s->name,
            'query' => $filters['q'] ?? $s->name,
            'filters' => $filters,
            'frequency' => $s->frequency ?? 'daily',
            'notifyEmail' => (bool) ($filters['notifyEmail'] ?? true),
            'notifyPush' => (bool) ($filters['notifyPush'] ?? false),
            'matchCount' => 0,
            'resultCount' => 0,
            'lastMatchedAt' => $s->last_notified_at?->toIso8601String(),
            'createdAt' => $s->created_at?->toIso8601String(),
        ];
    }
}
