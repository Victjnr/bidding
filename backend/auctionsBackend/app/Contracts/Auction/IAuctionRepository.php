<?php
namespace App\Contracts\Auction;
use App\Models\Auction;
use Illuminate\Database\Eloquent\Builder;

interface IAuctionRepository
{
    public function create(array $data): Auction;
    public function update(Auction $auction, array $data): bool;
    public function findByUuid(string $uuid): ?Auction;
    public function query(): Builder;
}
