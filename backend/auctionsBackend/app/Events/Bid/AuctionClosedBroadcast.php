<?php

namespace App\Events\Bid;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionClosedBroadcast implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $auctionUuid,
        public string $status,
        public ?string $winnerId,
        public ?string $winnerAlias,
        public ?float $finalPrice,
        public bool $isReserveMet,
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
        return 'auction.closed';
    }

    public function broadcastWith(): array
    {
        return [
            'auctionUuid' => $this->auctionUuid,
            'status' => $this->status,
            'winnerId' => $this->winnerId,
            'winner_id' => $this->winnerId,
            'winnerAlias' => $this->winnerAlias,
            'winner_alias' => $this->winnerAlias,
            'finalPrice' => $this->finalPrice,
            'final_price' => $this->finalPrice,
            'isReserveMet' => $this->isReserveMet,
            'is_reserve_met' => $this->isReserveMet,
        ];
    }
}
