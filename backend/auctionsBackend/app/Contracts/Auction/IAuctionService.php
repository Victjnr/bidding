<?php

namespace App\Contracts\Auction;

use App\DTOs\Auction\ApproveAuctionDTO;
use App\DTOs\Auction\CreateAuctionDTO;
use App\DTOs\Auction\MediaUploadDTO;
use App\Models\Auction;
use App\Models\User;
use Illuminate\Support\Collection;

interface IAuctionService
{
    public function create(CreateAuctionDTO $dto, User $seller): Auction;
    public function submitForReview(Auction $auction, User $user): Auction;
    public function approve(Auction $auction, ApproveAuctionDTO $dto): Auction;
    public function uploadMedia(MediaUploadDTO $dto): Collection;
    public function close(Auction $auction): void;
    
    // State machine methods
    public function activate(Auction $auction): Auction;
    public function antiSnipeExtend(Auction $auction): Auction;
    public function cancel(Auction $auction): Auction;
    public function enterClosingPhase(Auction $auction): Auction;
    public function timerExpired(Auction $auction): void;
    public function confirmWinner(Auction $auction): Auction;
    public function confirmNoSale(Auction $auction): Auction;
    public function raiseDispute(Auction $auction): Auction;
}
