<?php

namespace App\Jobs\Bid;

use App\Models\Auction;
use App\Models\Bid;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;

class PersistBidJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [1, 5, 10];

    public function __construct(
        public int $auctionId,
        public int $bidderId,
        public float $amount,
        public string $type,
        public string $bidUuid,
        public string $ipAddress,
        public ?string $deviceFingerprint,
    ) {}

    public function handle(): void
    {
        DB::transaction(function () {
            $bid = Bid::create([
                'uuid' => $this->bidUuid,
                'auction_id' => $this->auctionId,
                'bidder_id' => $this->bidderId,
                'amount' => $this->amount,
                'type' => $this->type,
                'ip_address' => $this->ipAddress,
                'device_fingerprint' => $this->deviceFingerprint,
            ]);

            Auction::where('id', $this->auctionId)->update([
                'current_price' => $this->amount,
                'total_bids' => DB::raw('total_bids + 1'),
                'winning_bid_id' => $bid->id,
                'winner_id' => $this->bidderId,
            ]);
        });

        // If auction end_at has passed, dispatch close job
        $auction = Auction::find($this->auctionId);
        if ($auction && $auction->end_at && $auction->end_at->isPast() && $auction->status->isBiddable()) {
            \App\Jobs\Auction\CloseAuctionJob::dispatch($auction);
        }
    }
}
