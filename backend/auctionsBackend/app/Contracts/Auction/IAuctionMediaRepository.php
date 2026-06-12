<?php
namespace App\Contracts\Auction;
use App\Models\AuctionMedia;

interface IAuctionMediaRepository
{
    public function create(array $data): AuctionMedia;
    public function countForAuction(int $auctionId): int;
}
