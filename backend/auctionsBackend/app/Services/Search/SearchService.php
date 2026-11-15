<?php

namespace App\Services\Search;

use App\Contracts\Search\ISearchService;
use App\DTOs\Search\SearchQueryDTO;
use App\Enums\AuctionStatus;
use App\Http\Resources\Auction\AuctionResource;
use App\Models\Auction;
use App\Models\Category;

class SearchService implements ISearchService
{
    public function search(SearchQueryDTO $dto, bool $isAuthenticated = false)
    {
        $query = Auction::query()
            ->with(['media', 'seller', 'category'])
            ->where('status', $dto->status ?? AuctionStatus::Active->value);

        if ($dto->since) {
            $query->where('created_at', '>=', $dto->since);
        }

        if ($dto->categoryId) {
            if (is_numeric($dto->categoryId)) {
                $query->where('category_id', (int) $dto->categoryId);
            } else {
                $query->whereHas('category', fn($q) => $q->where('slug', $dto->categoryId));
            }
        }

        if ($dto->minPrice !== null) {
            $query->where('current_price', '>=', $dto->minPrice);
        }

        if ($dto->maxPrice !== null) {
            $query->where('current_price', '<=', $dto->maxPrice);
        }

        if ($dto->q) {
            $searchTerm = trim($dto->q);
            $query->where(function ($q) use ($searchTerm) {
                $q->where('title', 'like', "%{$searchTerm}%")
                  ->orWhere('description', 'like', "%{$searchTerm}%");
            });
        }

        switch ($dto->sort) {
            case 'price_asc':
                $query->orderBy('current_price', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('current_price', 'desc');
                break;
            case 'most_bids':
                $query->orderBy('total_bids', 'desc');
                break;
            case 'newest':
                $query->latest();
                break;
            case 'ending_soon':
            default:
                $query->orderBy('end_at', 'asc');
                break;
        }

        return $query->paginate($dto->perPage, ['*'], 'page', $dto->page);
    }

    public function autocomplete(string $q): array
    {
        if (empty(trim($q))) {
            return [];
        }

        $q = trim($q);

        $auctions = Auction::where('status', AuctionStatus::Active)
            ->where('title', 'like', "%{$q}%")
            ->take(5)
            ->get(['uuid', 'title']);

        $categories = Category::where('name', 'like', "%{$q}%")
            ->take(3)
            ->get(['slug', 'name']);

        $suggestions = [];
        foreach ($auctions as $auction) {
            $suggestions[] = [
                'text' => $auction->title,
                'type' => 'auction',
                'slug' => $auction->uuid,
            ];
        }
        foreach ($categories as $cat) {
            $suggestions[] = [
                'text' => $cat->name,
                'type' => 'category',
                'slug' => $cat->slug,
            ];
        }

        return $suggestions;
    }
}
