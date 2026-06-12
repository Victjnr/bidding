<?php

namespace App\DTOs\Search;

readonly class SearchQueryDTO
{
    public function __construct(
        public ?string $q = null,
        public ?string $categoryId = null,
        public ?float $minPrice = null,
        public ?float $maxPrice = null,
        public ?string $sort = null,
        public ?string $status = null,
        public ?string $since = null,
        public int $page = 1,
        public int $perPage = 20,
    ) {}
    
    public static function fromRequest(\Illuminate\Http\Request $request): self
    {
        return new self(
            q: $request->input('q'),
            categoryId: $request->input('category_id'),
            minPrice: $request->input('min_price') ? (float)$request->input('min_price') : null,
            maxPrice: $request->input('max_price') ? (float)$request->input('max_price') : null,
            sort: $request->input('sort', 'relevance'),
            status: $request->input('status', \App\Enums\AuctionStatus::Active->value),
            page: (int) $request->input('page', 1),
            perPage: (int) $request->input('per_page', 20),
        );
    }
}
