<?php

namespace App\Contracts\Search;

use App\DTOs\Search\SearchQueryDTO;

interface ISearchService
{
    /**
     * Perform a full-text search with caching for unauthenticated users.
     */
    public function search(SearchQueryDTO $dto, bool $isAuthenticated = false);
    
    /**
     * Autocomplete using Redis sorted sets.
     */
    public function autocomplete(string $q): array;
}
