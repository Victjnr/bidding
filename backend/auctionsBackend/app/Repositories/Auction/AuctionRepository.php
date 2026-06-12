<?php
namespace App\Repositories\Auction;
use App\Contracts\Auction\IAuctionRepository;
use App\Models\Auction;
use Illuminate\Database\Eloquent\Builder;

class AuctionRepository implements IAuctionRepository
{
    public function create(array $data): Auction
    {
        return Auction::create($data);
    }

    public function update(Auction $auction, array $data): bool
    {
        return $auction->update($data);
    }

    public function findByUuid(string $uuid): ?Auction
    {
        return Auction::where('uuid', $uuid)->first();
    }

    public function query(): Builder
    {
        return Auction::query();
    }
}
