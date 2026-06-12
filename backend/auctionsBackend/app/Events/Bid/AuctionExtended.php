<?php

namespace App\Events\Bid;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AuctionExtended implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public string $auctionUuid,
        public string $newEndAt,
        public int $extensionCount,
    ) {}

    public function broadcastOn(): array
    {
        return [new PrivateChannel("auction.{$this->auctionUuid}")];
    }

    public function broadcastAs(): string
    {
        return 'auction.extended';
    }

    public function broadcastWith(): array
    {
        return [
            'new_end_at' => $this->newEndAt,
            'extension_count' => $this->extensionCount,
        ];
    }
}
