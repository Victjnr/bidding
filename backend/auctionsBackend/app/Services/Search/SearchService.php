<?php

namespace App\Services\Search;

use App\Contracts\Search\ISearchService;
use App\DTOs\Search\SearchQueryDTO;
use App\Enums\AuctionStatus;
use App\Models\Auction;
use Illuminate\Support\Facades\Redis;

class SearchService implements ISearchService
{
    public function search(SearchQueryDTO $dto, bool $isAuthenticated = false)
    {
        $key = 'search:' . md5(serialize($dto));

        if (!$isAuthenticated && Redis::exists($key)) {
            $cached = Redis::get($key);
            if ($cached) {
                return json_decode($cached);
            }
        }

        $query = Auction::query()
            ->select(['id', 'uuid', 'category_id', 'seller_id', 'title', 'description', 'current_price', 'status', 'end_at'])
            ->where('status', $dto->status ?? AuctionStatus::Active->value);

        if ($dto->since) {
            $query->where('created_at', '>=', $dto->since);
        }

        if ($dto->categoryId) {
            $query->where('category_id', $dto->categoryId);
        }

        if ($dto->minPrice !== null) {
            $query->where('current_price', '>=', $dto->minPrice);
        }

        if ($dto->maxPrice !== null) {
            $query->where('current_price', '<=', $dto->maxPrice);
        }

        if ($dto->q) {
            $searchTerm = $dto->q;
            // Simple sanitization for MATCH AGAINST boolean mode
            $booleanSearch = '+' . str_replace(' ', '* +', trim($searchTerm)) . '*';

            $query->whereRaw(
                "MATCH(title,description) AGAINST(? IN BOOLEAN MODE)",
                [$booleanSearch]
            )->orderByRaw("MATCH(title,description) AGAINST(?) DESC", [$searchTerm]);
        } elseif ($dto->sort) {
            // Basic sort handling, usually via spatie/laravel-query-builder in Controller,
            // but we add a fallback sort if q is absent.
            if ($dto->sort === 'newest') {
                $query->latest();
            } elseif ($dto->sort === 'ending_soon') {
                $query->orderBy('end_at', 'asc');
            }
        }

        // Eager load related
        $query->with([
            'media' => function($q) { $q->where('is_primary', true); },
            'seller:id,uuid,first_name,last_name',
            // 'category:id,name' -> assuming Category model exists, omitted for brevity if not strictly defined yet
        ]);

        $results = $query->paginate($dto->perPage, ['*'], 'page', $dto->page);

        // We could also calculate facets here via separate COUNT queries and attach them to the result
        
        $response = $results->toArray();

        if (!$isAuthenticated) {
            Redis::setex($key, 120, json_encode($response)); // Cache for 2 mins
        }

        return $response;
    }

    public function autocomplete(string $q): array
    {
        if (empty(trim($q))) {
            return [];
        }

        $q = strtolower(trim($q));
        
        // Redis prefix search using ZRANGEBYLEX
        // ZRANGEBYLEX key [prefix [prefix\xff
        // The \xff is the max byte, ensuring we get all strings starting with the prefix.
        $results = Redis::zRangeByLex("search:autocomplete", "[{$q}", "[{$q}\xff", 0, 8);

        return $results ?: [];
    }
}
