<?php

namespace App\Contracts\Bid;

use App\Models\Bid;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

interface IBidRepository
{
    public function create(array $data): Bid;
    public function highestForAuction(int $auctionId): ?Bid;
    public function paginateForAuction(int $auctionId, int $perPage = 20): LengthAwarePaginator;
}
