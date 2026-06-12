<?php

namespace App\Events\Bid;

use Illuminate\Broadcasting\InteractsWithSockets;
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
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("auction.{$this->auctionUuid}")];
    }

    public function broadcastAs(): string
    {
        return 'bid.placed';
    }

    public function broadcastWith(): array
    {
        return [
            'bid_uuid' => $this->bidUuid,
            'amount' => $this->amount,
            'bidder_alias' => $this->bidderAlias,
            'total_bids' => $this->totalBids,
            'is_reserve_met' => $this->isReserveMet,
            'next_minimum_bid' => $this->nextMinimumBid,
            'time_remaining_seconds' => $this->timeRemainingSeconds,
            'current_price' => $this->currentPrice,
        ];
    }
}
