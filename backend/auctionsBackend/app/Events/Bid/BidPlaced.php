<?php

namespace App\Events\Bid;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BidPlaced implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $auctionUuid,
        public string $bidUuid,
        public float $amount,
        public string $bidderAlias,
        public int $totalBids,
        public bool $isReserveMet,
        public float $nextMinimumBid,
        public int $timeRemainingSeconds,
        public float $currentPrice,
        public string $bidType = 'manual',
    ) {}

    public function broadcastOn(): array
    {
        return [
            new PresenceChannel("auction.{$this->auctionUuid}"),
            new PrivateChannel("auction.{$this->auctionUuid}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    public function broadcastWith(): array
    {
        return [
            'bidId' => $this->bidUuid,
            'bid_uuid' => $this->bidUuid,
            'auctionUuid' => $this->auctionUuid,
            'amount' => $this->amount,
            'bidderAlias' => $this->bidderAlias,
            'bidder_alias' => $this->bidderAlias,
            'bidType' => $this->bidType,
            'createdAt' => now()->toIso8601String(),
            'totalBids' => $this->totalBids,
            'total_bids' => $this->totalBids,
            'isReserveMet' => $this->isReserveMet,
            'is_reserve_met' => $this->isReserveMet,
            'nextMinimumBid' => $this->nextMinimumBid,
            'next_minimum_bid' => $this->nextMinimumBid,
            'timeRemainingSeconds' => $this->timeRemainingSeconds,
            'time_remaining_seconds' => $this->timeRemainingSeconds,
            'currentPrice' => $this->currentPrice,
            'current_price' => $this->currentPrice,
        ];
    }
}
