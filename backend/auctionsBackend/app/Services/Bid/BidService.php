<?php

namespace App\Services\Bid;

use App\Contracts\Bid\IBidService;
use App\DTOs\Bid\BidResultDTO;
use App\DTOs\Bid\PlaceBidDTO;
use App\DTOs\Bid\SetProxyBidDTO;
use App\Enums\AuctionStatus;
use App\Events\Bid\AuctionExtended;
use App\Events\Bid\BidPlaced;
use App\Exceptions\AuctionNotActiveException;
use App\Exceptions\BidTooLowException;
use App\Exceptions\CannotBidOwnAuctionException;
use App\Exceptions\DuplicateBidException;
use App\Exceptions\KycTierInsufficientException;
use App\Exceptions\TooManyBidsException;
use App\Jobs\Bid\CheckProxyBidsJob;
use App\Jobs\Bid\PersistBidJob;
use App\Jobs\Bid\UpdateAuctionEndAtJob;
use App\Models\Auction;
use App\Models\ProxyBid;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Str;

class BidService implements IBidService
{
    /**
     * CRITICAL PATH — placeBid
     *
     * 9-step hot path: Redis-first, async DB persistence, zero blocking.
     */
    public function placeBid(PlaceBidDTO $dto): BidResultDTO
    {
        // ── STEP 1: Load auction from Redis cache ──
        $cacheKey = "bidflow:auction:{$dto->auctionUuid}:state";
        $cached = Redis::get($cacheKey);

        if (!$cached) {
            $auction = Auction::where('uuid', $dto->auctionUuid)->firstOrFail();
            $state = [
                'id' => $auction->id,
                'uuid' => $auction->uuid,
                'seller_id' => $auction->seller_id,
                'status' => $auction->status->value,
                'current_price' => (float) $auction->current_price,
                'reserve_price' => $auction->reserve_price ? (float) $auction->reserve_price : null,
                'bid_increment_value' => (float) $auction->bid_increment_value,
                'total_bids' => (int) $auction->total_bids,
                'end_at' => $auction->end_at->timestamp,
                'anti_snipe_minutes' => (int) $auction->anti_snipe_minutes,
                'anti_snipe_extend_minutes' => (int) $auction->anti_snipe_extend_minutes,
                'max_extension_minutes' => (int) $auction->max_extension_minutes,
                'required_kyc_tier' => 0,
            ];
            Redis::setex($cacheKey, 60, json_encode($state));
        } else {
            $state = json_decode($cached, true);
        }

        $auctionId = $state['id'];

        // ── STEP 2: Pre-validation (domain exceptions) ──
        $status = AuctionStatus::from($state['status']);
        if (!$status->isBiddable()) {
            throw new AuctionNotActiveException();
        }

        if ($dto->bidderId === $state['seller_id']) {
            throw new CannotBidOwnAuctionException();
        }

        $bidder = User::findOrFail($dto->bidderId);
        if (($bidder->kyc_tier ?? 0) < $state['required_kyc_tier']) {
            throw new KycTierInsufficientException();
        }

        // Read live price from Redis (atomic source of truth)
        $livePrice = (float) (Redis::get("bidflow:auction:{$auctionId}:current_price") ?? $state['current_price']);
        $increment = (float) $state['bid_increment_value'];
        $minRequired = $livePrice + $increment;

        if ($dto->amount < $minRequired) {
            throw new BidTooLowException($minRequired);
        }

        // ── STEP 3: Rate limit ──
        $rateKey = "bidflow:user:{$dto->bidderId}:bid_rate";
        $currentRate = (int) Redis::incr($rateKey);
        if ($currentRate === 1) {
            Redis::expire($rateKey, 60);
        }
        if ($currentRate > 30) {
            throw new TooManyBidsException();
        }

        // ── STEP 4: Atomic Redis MULTI/EXEC ──
        $bidUuid = (string) Str::uuid();
        $microtime = microtime(true);
        $retries = 0;

        do {
            $results = Redis::transaction(function ($tx) use ($auctionId, $dto, $microtime) {
                $tx->zadd("bidflow:auction:{$auctionId}:bids", $dto->amount, "{$dto->bidderId}:{$microtime}");
                $tx->set("bidflow:auction:{$auctionId}:current_price", $dto->amount);
                $tx->incr("bidflow:auction:{$auctionId}:bid_count");
            });

            if ($results !== null) {
                break;
            }

            $retries++;
            if ($retries >= 3) {
                throw new DuplicateBidException();
            }
        } while (true);

        $totalBids = (int) ($results[2] ?? Redis::get("bidflow:auction:{$auctionId}:bid_count") ?? 0);

        // ── STEP 5: Anti-snipe ──
        $endAt = (int) (Redis::get("bidflow:auction:{$auctionId}:end_at") ?? $state['end_at']);
        $timeRemaining = $endAt - now()->timestamp;
        $antiSnipeWindow = $state['anti_snipe_minutes'] * 60;

        if ($timeRemaining > 0 && $timeRemaining < $antiSnipeWindow) {
            $extCount = (int) Redis::incr("bidflow:auction:{$auctionId}:extension_count");
            $maxExtensions = (int) floor($state['max_extension_minutes'] / max(1, $state['anti_snipe_extend_minutes']));

            if ($extCount <= $maxExtensions) {
                $newEnd = now()->addMinutes($state['anti_snipe_extend_minutes']);
                Redis::set("bidflow:auction:{$auctionId}:end_at", $newEnd->timestamp);
                $endAt = $newEnd->timestamp;
                $timeRemaining = $endAt - now()->timestamp;

                broadcast(new AuctionExtended(
                    $state['uuid'],
                    $newEnd->toIso8601String(),
                    $extCount
                ))->toOthers();

                UpdateAuctionEndAtJob::dispatch($auctionId, $newEnd)
                    ->onQueue('bids');
            }
        }

        // ── STEP 6: Async persistence (NON-BLOCKING) ──
        PersistBidJob::dispatch(
            $auctionId,
            $dto->bidderId,
            $dto->amount,
            $dto->type->value,
            $bidUuid,
            $dto->ipAddress,
            $dto->deviceFingerprint
        )->onQueue('bids')->afterCommit();

        // ── STEP 7: Broadcast BidPlaced via Reverb ──
        $reservePrice = $state['reserve_price'];
        $isReserveMet = $reservePrice === null || $dto->amount >= $reservePrice;
        $nextMinBid = $dto->amount + $increment;

        broadcast(new BidPlaced(
            auctionUuid: $state['uuid'],
            bidUuid: $bidUuid,
            amount: $dto->amount,
            bidderAlias: $bidder->display_name ?? 'Bidder',
            totalBids: $totalBids,
            isReserveMet: $isReserveMet,
            nextMinimumBid: $nextMinBid,
            timeRemainingSeconds: max(0, $timeRemaining),
            currentPrice: $dto->amount
        ))->toOthers();

        // ── STEP 8: Trigger proxy check async ──
        CheckProxyBidsJob::dispatch($auctionId, $dto->amount, $dto->bidderId)
            ->onQueue('proxy_bids');

        // ── STEP 9: Return BidResultDTO from Redis (no DB roundtrip) ──
        return new BidResultDTO(
            bidUuid: $bidUuid,
            amount: $dto->amount,
            isWinning: true,
            currentPrice: $dto->amount,
            totalBids: $totalBids,
            isReserveMet: $isReserveMet,
            nextMinimumBid: $nextMinBid,
            timeRemainingSeconds: max(0, $timeRemaining),
        );
    }

    /**
     * Set or update a proxy bid. Max amount is encrypted at rest.
     */
    public function setProxyBid(SetProxyBidDTO $dto): ProxyBid
    {
        $auction = Auction::where('uuid', $dto->auctionUuid)->firstOrFail();

        $proxy = ProxyBid::updateOrCreate(
            [
                'auction_id' => $auction->id,
                'bidder_id' => $dto->bidderId,
            ],
            [
                'max_amount' => Crypt::encryptString((string) $dto->maxAmount),
                'is_active' => true,
                'is_exhausted' => false,
            ]
        );

        // Trigger immediate proxy check
        CheckProxyBidsJob::dispatch($auction->id, (float) $auction->current_price, $dto->bidderId)
            ->onQueue('proxy_bids');

        return $proxy;
    }

    /**
     * Cancel (deactivate) a proxy bid.
     */
    public function cancelProxyBid(string $auctionUuid, int $bidderId): void
    {
        $auction = Auction::where('uuid', $auctionUuid)->firstOrFail();

        ProxyBid::where('auction_id', $auction->id)
            ->where('bidder_id', $bidderId)
            ->update(['is_active' => false]);
    }
}
