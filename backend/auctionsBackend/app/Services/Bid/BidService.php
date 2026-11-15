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
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class BidService implements IBidService
{
    /**
     * CRITICAL PATH — placeBid
     *
     * Supports both Cache (database/redis) and immediate DB consistency.
     */
    public function placeBid(PlaceBidDTO $dto): BidResultDTO
    {
        $auction = Auction::where('uuid', $dto->auctionUuid)->firstOrFail();
        $auctionId = $auction->id;

        // ── STEP 1: Pre-validation (domain exceptions) ──
        $status = $auction->status;
        if (!$status->isBiddable()) {
            throw new AuctionNotActiveException();
        }

        if ((int) $dto->bidderId === (int) $auction->seller_id) {
            throw new CannotBidOwnAuctionException();
        }

        $bidder = User::findOrFail($dto->bidderId);
        $requiredKycTier = 0;
        if ($bidder->getNumericKycTier() < $requiredKycTier) {
            throw new KycTierInsufficientException();
        }

        $livePrice = (float) ($auction->current_price ?? $auction->start_price ?? 0);
        $increment = (float) ($auction->bid_increment_value ?: 10);
        $minRequired = (int) $auction->total_bids === 0 && $livePrice > 0
            ? $livePrice
            : $livePrice + $increment;

        if ($dto->amount < $minRequired) {
            throw new BidTooLowException($minRequired);
        }

        // ── STEP 2: Rate limit via Cache ──
        $rateKey = "bidflow:user:{$dto->bidderId}:bid_rate";
        $currentRate = (int) Cache::get($rateKey, 0) + 1;
        Cache::put($rateKey, $currentRate, 60);
        if ($currentRate > 30) {
            throw new TooManyBidsException();
        }

        // ── STEP 3: Persist Bid & Update Auction Atomically ──
        $bidUuid = (string) Str::uuid();
        (new PersistBidJob(
            $auctionId,
            $dto->bidderId,
            $dto->amount,
            $dto->type->value,
            $bidUuid,
            $dto->ipAddress ?? '127.0.0.1',
            $dto->deviceFingerprint
        ))->handle();

        $auction->refresh();
        $totalBids = (int) $auction->total_bids;

        // ── STEP 4: Anti-snipe ──
        $endAt = $auction->end_at ? $auction->end_at->timestamp : now()->addDay()->timestamp;
        $timeRemaining = $endAt - now()->timestamp;
        $antiSnipeWindow = (int) ($auction->anti_snipe_minutes ?? 0) * 60;

        if ($antiSnipeWindow > 0 && $timeRemaining > 0 && $timeRemaining < $antiSnipeWindow) {
            $extKey = "bidflow:auction:{$auctionId}:extension_count";
            $extCount = (int) Cache::get($extKey, 0) + 1;
            Cache::put($extKey, $extCount, 86400);

            $extendMins = max(1, (int) ($auction->anti_snipe_extend_minutes ?: 5));
            $maxExtMins = max($extendMins, (int) ($auction->max_extension_minutes ?: 25));
            $maxExtensions = (int) floor($maxExtMins / $extendMins);

            if ($extCount <= $maxExtensions) {
                $newEnd = now()->addMinutes($extendMins);
                $auction->update([
                    'end_at' => $newEnd,
                    'status' => AuctionStatus::Extended->value,
                ]);
                $endAt = $newEnd->timestamp;
                $timeRemaining = $endAt - now()->timestamp;

                try {
                    broadcast(new AuctionExtended(
                        $auction->uuid,
                        $newEnd->toIso8601String(),
                        $extCount
                    ))->toOthers();
                } catch (\Throwable) {
                }
            }
        }

        // ── STEP 5: Broadcast BidPlaced ──
        $reservePrice = $auction->reserve_price !== null ? (float) $auction->reserve_price : null;
        $isReserveMet = $reservePrice === null || $dto->amount >= $reservePrice;
        $nextMinBid = $dto->amount + $increment;

        try {
            broadcast(new BidPlaced(
                auctionUuid: $auction->uuid,
                bidUuid: $bidUuid,
                amount: $dto->amount,
                bidderAlias: $bidder->display_name ?? $bidder->first_name ?? 'Bidder',
                totalBids: $totalBids,
                isReserveMet: $isReserveMet,
                nextMinimumBid: $nextMinBid,
                timeRemainingSeconds: max(0, $timeRemaining),
                currentPrice: $dto->amount,
                bidType: $dto->type->value
            ))->toOthers();
        } catch (\Throwable) {
        }

        // ── STEP 6: Trigger proxy check ──
        try {
            (new CheckProxyBidsJob($auctionId, $dto->amount, $dto->bidderId))->handle($this);
        } catch (\Throwable) {
        }

        return new BidResultDTO(
            bidUuid: $bidUuid,
            amount: $dto->amount,
            isWinning: true,
            currentPrice: (float) $auction->current_price,
            totalBids: (int) $auction->total_bids,
            isReserveMet: $isReserveMet,
            nextMinimumBid: (float) $auction->current_price + $increment,
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
