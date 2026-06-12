<?php
namespace App\Repositories\Auction;
use App\Contracts\Auction\IAuctionMediaRepository;
use App\Models\AuctionMedia;

class AuctionMediaRepository implements IAuctionMediaRepository
{
    public function create(array $data): AuctionMedia
    {
        return AuctionMedia::create($data);
    }

    public function countForAuction(int $auctionId): int
    {
        return AuctionMedia::where('auction_id', $auctionId)->count();
    }
}
