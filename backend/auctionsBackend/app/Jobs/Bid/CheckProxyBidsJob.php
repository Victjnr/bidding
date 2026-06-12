<?php

namespace App\Jobs\Bid;

use App\Contracts\Bid\IBidService;
use App\DTOs\Bid\PlaceBidDTO;
use App\Enums\BidType;
use App\Events\Bid\ProxyBidExhausted;
use App\Models\Auction;
use App\Models\ProxyBid;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Crypt;

class CheckProxyBidsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;

    public function __construct(
        public int $auctionId,
        public float $incomingAmount,
        public int $incomingBidderId,
    ) {}

    public function handle(IBidService $bidService): void
    {
        $auction = Auction::find($this->auctionId);
        if (!$auction || !$auction->status->isBiddable()) {
            return;
        }

        $increment = (float) $auction->bid_increment_value;

        // Find competing proxy bids (not from incoming bidder)
        $proxies = ProxyBid::where('auction_id', $this->auctionId)
            ->where('bidder_id', '!=', $this->incomingBidderId)
            ->where('is_active', true)
            ->where('is_exhausted', false)
            ->orderBy('created_at', 'asc') // earliest proxy wins ties
            ->get();

        foreach ($proxies as $proxy) {
            $decryptedMax = (float) Crypt::decryptString($proxy->max_amount);

            if ($decryptedMax <= $this->incomingAmount) {
                // Proxy is already outbid — mark exhausted
                $proxy->update(['is_exhausted' => true]);
                event(new ProxyBidExhausted($proxy->bidder_id, $auction->uuid));
                continue;
            }

            // Calculate counter-bid
            $counterAmount = $this->incomingAmount + $increment;

            if ($counterAmount > $decryptedMax) {
                // Counter would exceed max — bid at max, then mark exhausted
                $counterAmount = $decryptedMax;
            }

            // Place the automatic counter-bid
            $bidService->placeBid(new PlaceBidDTO(
                auctionUuid: $auction->uuid,
                bidderId: $proxy->bidder_id,
                amount: $counterAmount,
                type: BidType::Automatic,
                ipAddress: '0.0.0.0', // system-generated
                deviceFingerprint: null,
            ));

            // If we bid at max, mark exhausted after placing
            if ($counterAmount >= $decryptedMax) {
                $proxy->update(['is_exhausted' => true]);
                event(new ProxyBidExhausted($proxy->bidder_id, $auction->uuid));
            }

            // Only the first (earliest) competing proxy fires
            break;
        }
    }
}
