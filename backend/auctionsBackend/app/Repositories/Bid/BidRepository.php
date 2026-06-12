<?php

namespace App\Repositories\Bid;

use App\Contracts\Bid\IBidRepository;
use App\Models\Bid;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BidRepository implements IBidRepository
{
    public function create(array $data): Bid
    {
        return Bid::create($data);
    }

    public function highestForAuction(int $auctionId): ?Bid
    {
        return Bid::where('auction_id', $auctionId)
            ->orderByDesc('amount')
            ->first();
    }

    public function paginateForAuction(int $auctionId, int $perPage = 20): LengthAwarePaginator
    {
        return Bid::where('auction_id', $auctionId)
            ->orderByDesc('amount')
            ->paginate($perPage);
    }
}
