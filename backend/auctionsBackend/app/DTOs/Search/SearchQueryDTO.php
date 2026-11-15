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
        $minPrice = $request->input('minPrice') ?? $request->input('min_price');
        $maxPrice = $request->input('maxPrice') ?? $request->input('max_price');
        return new self(
            q: $request->input('q') ?? $request->input('search'),
            categoryId: $request->input('category') ?? $request->input('category_id') ?? $request->input('categoryId'),
            minPrice: $minPrice !== null && $minPrice !== '' ? (float) $minPrice : null,
            maxPrice: $maxPrice !== null && $maxPrice !== '' ? (float) $maxPrice : null,
            sort: $request->input('sort', 'relevance'),
            status: $request->input('status', \App\Enums\AuctionStatus::Active->value),
            page: (int) $request->input('page', 1),
            perPage: (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20),
        );
    }
}
