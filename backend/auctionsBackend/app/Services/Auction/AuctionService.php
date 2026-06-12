<?php

namespace App\Services\Auction;

use App\Contracts\Auction\IAuctionMediaRepository;
use App\Contracts\Auction\IAuctionRepository;
use App\Contracts\Auction\IAuctionService;
use App\DTOs\Auction\ApproveAuctionDTO;
use App\DTOs\Auction\CreateAuctionDTO;
use App\DTOs\Auction\MediaUploadDTO;
use App\Enums\AuctionStatus;
use App\Exceptions\InvalidStateTransitionException;
use App\Jobs\Auction\ActivateAuctionJob;
use App\Jobs\Auction\CloseAuctionJob;
use App\Jobs\Auction\ProcessImageJob;
use App\Models\Auction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class AuctionService implements IAuctionService
{
    public function __construct(
        protected readonly IAuctionRepository $auctionRepository,
        protected readonly IAuctionMediaRepository $mediaRepository
    ) {}

    protected function transition(Auction $auction, AuctionStatus $toStatus): void
    {
        $validTransitions = [
            AuctionStatus::Draft->value => [AuctionStatus::Pending],
            AuctionStatus::Pending->value => [AuctionStatus::Scheduled, AuctionStatus::Draft],
            AuctionStatus::Scheduled->value => [AuctionStatus::Active],
            AuctionStatus::Active->value => [AuctionStatus::Extended, AuctionStatus::Cancelled, AuctionStatus::Closing],
            AuctionStatus::Extended->value => [AuctionStatus::Extended, AuctionStatus::Closing],
            AuctionStatus::Closing->value => [AuctionStatus::Ended],
            AuctionStatus::Ended->value => [AuctionStatus::Sold, AuctionStatus::NoSale],
            AuctionStatus::Sold->value => [AuctionStatus::Disputed],
        ];

        $current = $auction->status;

        if (!isset($validTransitions[$current->value]) || !in_array($toStatus, $validTransitions[$current->value])) {
            throw new InvalidStateTransitionException($current, $toStatus);
        }

        $this->auctionRepository->update($auction, ['status' => $toStatus->value]);
        $auction->status = $toStatus;
    }

    public function create(CreateAuctionDTO $dto, User $seller): Auction
    {
        if (!$seller->hasRole('seller') || $seller->kyc_tier < 1) {
            abort(403, 'User is not eligible to create an auction.');
        }

        if ($dto->endAt->lte($dto->startAt->copy()->addHour())) {
            abort(422, 'End time must be at least 1 hour after start time.');
        }

        if ($dto->reservePrice !== null && $dto->reservePrice <= $dto->startPrice) {
            abort(422, 'Reserve price must be greater than start price.');
        }

        $auction = $this->auctionRepository->create([
            'seller_id' => $seller->id,
            'category_id' => $dto->categoryId,
            'title' => $dto->title,
            'description' => $dto->description,
            'auction_type' => $dto->auctionType->value,
            'status' => AuctionStatus::Draft->value,
            'condition' => $dto->condition,
            'location_country' => $dto->locationCountry,
            'location_city' => $dto->locationCity,
            'currency_code' => $dto->currencyCode,
            'start_price' => $dto->startPrice,
            'current_price' => $dto->startPrice,
            'reserve_price' => $dto->reservePrice,
            'bin_price' => $dto->binPrice,
            'bid_increment_type' => $dto->bidIncrementType,
            'bid_increment_value' => $dto->bidIncrementValue,
            'deposit_required' => $dto->depositRequired,
            'deposit_amount' => $dto->depositAmount,
            'start_at' => $dto->startAt,
            'end_at' => $dto->endAt,
            'anti_snipe_minutes' => $dto->antiSnipeMinutes,
            'anti_snipe_extend_minutes' => $dto->antiSnipeExtendMinutes,
            'max_extension_minutes' => $dto->maxExtensionMinutes,
        ]);

        return $auction;
    }

    public function submitForReview(Auction $auction, User $user): Auction
    {
        $mediaCount = $this->mediaRepository->countForAuction($auction->id);
        if ($mediaCount < 1) {
            abort(422, 'At least 1 media item is required before submission.');
        }

        $this->transition($auction, AuctionStatus::Pending);
        return $auction;
    }

    public function approve(Auction $auction, ApproveAuctionDTO $dto): Auction
    {
        $this->transition($auction, AuctionStatus::Scheduled);

        $delay = Carbon::now()->diffInSeconds($auction->start_at, false);
        if ($delay <= 0) {
            $delay = 0;
        }
        
        ActivateAuctionJob::dispatch($auction)->delay(now()->addSeconds($delay));

        return $auction;
    }

    public function uploadMedia(MediaUploadDTO $dto): Collection
    {
        $auction = $this->auctionRepository->findByUuid($dto->auctionId);
        if (!$auction) abort(404, 'Auction not found');

        $uploaded = collect();

        foreach ($dto->files as $file) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file->getRealPath());
            finfo_close($finfo);

            if (!str_starts_with($mime, 'image/') && !str_starts_with($mime, 'video/')) {
                abort(422, 'Invalid file type: ' . $mime);
            }

            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("auctions/{$auction->uuid}", $filename, 'local');

            $media = $this->mediaRepository->create([
                'auction_id' => $auction->id,
                'file_path' => $path,
                'mime_type' => $mime,
                'is_primary' => $dto->isPrimary && $uploaded->isEmpty(),
                'sort_order' => 0,
            ]);

            ProcessImageJob::dispatch($media);
            $uploaded->push($media);
        }

        return $uploaded;
    }

    public function activate(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Active);

        $delay = Carbon::now()->diffInSeconds($auction->end_at, false);
        if ($delay > 0) {
            CloseAuctionJob::dispatch($auction)->delay(now()->addSeconds($delay));
        } else {
            CloseAuctionJob::dispatch($auction);
        }

        return $auction;
    }

    public function antiSnipeExtend(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Extended);
        return $auction;
    }

    public function enterClosingPhase(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Closing);
        return $auction;
    }

    public function timerExpired(Auction $auction): void
    {
        $this->transition($auction, AuctionStatus::Ended);
        $this->close($auction);
    }

    public function cancel(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Cancelled);
        return $auction;
    }

    public function close(Auction $auction): void
    {
        if ($auction->reserve_price !== null && $auction->current_price < $auction->reserve_price) {
            $this->confirmNoSale($auction);
        } else {
            if ($auction->winning_bid_id) {
                $this->confirmWinner($auction);
            } else {
                $this->confirmNoSale($auction);
            }
        }
    }

    public function confirmWinner(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Sold);
        return $auction;
    }

    public function confirmNoSale(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::NoSale);
        return $auction;
    }

    public function raiseDispute(Auction $auction): Auction
    {
        $this->transition($auction, AuctionStatus::Disputed);
        return $auction;
    }
}
