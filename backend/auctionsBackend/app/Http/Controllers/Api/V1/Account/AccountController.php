<?php

namespace App\Http\Controllers\Api\V1\Account;

use App\Contracts\Account\IAccountService;
use App\DTOs\Account\ChangePasswordDTO;
use App\DTOs\Account\UpdateProfileDTO;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Account\AddressRequest;
use App\Http\Requests\Account\AvatarRequest;
use App\Http\Requests\Account\BidFilterRequest;
use App\Http\Requests\Account\ChangePasswordRequest;
use App\Http\Requests\Account\CloseAccountRequest;
use App\Http\Requests\Account\UpdateProfileRequest;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountController extends Controller
{
    public function __construct(
        protected readonly IAccountService $accountService
    ) {}

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success(new \App\Http\Resources\Auth\UserResource($request->user()));
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $dto = new UpdateProfileDTO(
            firstName: $request->input('firstName'),
            lastName: $request->input('lastName'),
            displayName: $request->input('displayName'),
            bio: $request->input('bio'),
            phone: $request->input('phone'),
        );

        $user = $this->accountService->updateProfile($request->user(), $dto);

        if ($request->has('anonymousBidding') || $request->has('is_anonymous')) {
            $user->is_anonymous = $request->boolean('anonymousBidding', $request->boolean('is_anonymous'));
            $user->save();
        }

        return ApiResponse::success(new \App\Http\Resources\Auth\UserResource($user->fresh()), 'Profile updated');
    }

    public function uploadAvatar(AvatarRequest $request): JsonResponse
    {
        $url = $this->accountService->uploadAvatar($request->user(), $request->file('avatar'));
        return ApiResponse::success(['avatarUrl' => $url, 'avatar_url' => $url], 'Avatar uploaded');
    }

    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $dto = new ChangePasswordDTO(
            currentPassword: $request->input('currentPassword'),
            newPassword: $request->input('newPassword'),
        );

        $this->accountService->changePassword($request->user(), $dto);
        return ApiResponse::success(null, 'Password changed. You have been logged out of all sessions.');
    }

    public function activeSessions(Request $request): JsonResponse
    {
        $currentTokenId = $request->user()->currentAccessToken()?->id;

        $sessions = $request->user()->tokens()->get()->map(fn($token) => [
            'id' => (string) $token->id,
            'device' => $token->name ?? 'Unknown Device',
            'browser' => 'Web Browser',
            'os' => 'Windows / Web',
            'ip' => $request->ip() ?? '127.0.0.1',
            'location' => 'Harare, ZW',
            'lastActiveAt' => $token->last_used_at?->toIso8601String() ?? $token->created_at->toIso8601String(),
            'lastActive' => $token->last_used_at?->toIso8601String() ?? $token->created_at->toIso8601String(),
            'isCurrent' => $currentTokenId === $token->id,
        ]);

        return ApiResponse::success($sessions);
    }

    public function loginHistory(Request $request): JsonResponse
    {
        $history = $request->user()->tokens()->latest()->take(10)->get()->map(fn($token) => [
            'id' => $token->id,
            'ip' => $request->ip() ?? '127.0.0.1',
            'location' => 'Harare, ZW',
            'device' => $token->name ?? 'Web Browser',
            'browser' => 'Chrome',
            'status' => 'success',
            'createdAt' => $token->created_at?->toIso8601String(),
        ]);

        return ApiResponse::success($history);
    }

    public function revokeSession(Request $request, string $id): JsonResponse
    {
        $this->accountService->revokeSession($request->user(), (int) $id);
        return ApiResponse::success(null, 'Session revoked');
    }

    public function myBids(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = $user->bids()->with(['auction.media', 'auction.seller', 'auction.category']);

        $status = $request->input('status');
        if ($status === 'winning') {
            $query->whereHas('auction', function ($q) {
                $q->whereIn('status', ['active', 'extended', 'closing'])
                  ->where(function ($sub) {
                      $sub->whereColumn('auctions.winning_bid_id', 'bids.id')
                          ->orWhere(function ($sub2) {
                              $sub2->whereNull('auctions.winning_bid_id')
                                   ->whereColumn('auctions.winner_id', 'bids.bidder_id')
                                   ->whereColumn('bids.amount', '>=', 'auctions.current_price');
                          });
                  });
            });
        } elseif ($status === 'active') {
            $query->whereHas('auction', fn($q) => $q->whereIn('status', ['active', 'extended', 'closing']));
        } elseif ($status === 'outbid') {
            $query->whereHas('auction', function ($q) {
                $q->whereIn('status', ['active', 'extended', 'closing'])
                  ->where(function ($sub) {
                      $sub->whereColumn('auctions.winning_bid_id', '!=', 'bids.id')
                          ->orWhereNull('auctions.winning_bid_id');
                  })
                  ->whereColumn('bids.amount', '<', 'auctions.current_price');
            });
        } elseif ($status === 'won') {
            $query->whereHas('auction', function ($q) {
                $q->whereIn('status', ['ended', 'sold', 'closed', 'settled'])
                  ->where(function ($sub) {
                      $sub->whereColumn('auctions.winning_bid_id', 'bids.id')
                          ->orWhere(function ($sub2) {
                              $sub2->whereNull('auctions.winning_bid_id')
                                   ->whereColumn('auctions.winner_id', 'bids.bidder_id');
                          });
                  });
            });
        } elseif ($status === 'lost') {
            $query->whereHas('auction', function ($q) use ($user) {
                $q->whereIn('status', ['ended', 'sold', 'no_sale', 'closed', 'settled'])
                  ->where(function ($sub) {
                      $sub->whereColumn('auctions.winning_bid_id', '!=', 'bids.id')
                          ->orWhereNull('auctions.winning_bid_id');
                  })
                  ->where(function ($sub) use ($user) {
                      $sub->where('auctions.winner_id', '!=', $user->id)
                          ->orWhereNull('auctions.winner_id');
                  });
            });
        }

        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $bids = $query->latest()->paginate($perPage);

        $formatted = collect($bids->items())->map(function ($bid) {
            $auction = $bid->auction;
            $auctionData = $auction ? (new \App\Http\Resources\Auction\AuctionResource($auction))->resolve() : [];
            $primaryMedia = $auction?->media?->firstWhere('is_primary', true) ?? $auction?->media?->first();
            $auctionStatus = $auction?->status?->value ?? (string) ($auction?->status ?? 'active');

            $isWinning = $auction && (
                ((int) $auction->winning_bid_id > 0 && (int) $auction->winning_bid_id === (int) $bid->id)
                || (!$auction->winning_bid_id && (int) $auction->winner_id === (int) $bid->bidder_id && (float) $bid->amount >= (float) $auction->current_price)
                || (!$auction->winning_bid_id && !$auction->winner_id && (float) $bid->amount >= (float) $auction->current_price)
            );

            if (in_array($auctionStatus, ['ended', 'sold', 'no_sale', 'closed', 'settled'], true)) {
                $bidStatus = ($isWinning && $auctionStatus !== 'no_sale') ? 'won' : 'lost';
            } else {
                $bidStatus = $isWinning ? 'highest' : 'outbid';
            }

            return array_merge($auctionData, [
                'id' => $bid->id,
                'uuid' => $auction?->uuid ?? $bid->uuid,
                'bidUuid' => $bid->uuid,
                'auctionUuid' => $auction?->uuid ?? '',
                'auctionTitle' => $auction?->title ?? 'Auction',
                'auctionThumbnail' => $primaryMedia?->url,
                'auctionStatus' => $auctionStatus,
                'auctionEndAt' => $auction?->end_at?->toIso8601String(),
                'myBidAmount' => (float) $bid->amount,
                'myMaxBid' => (float) $bid->amount,
                'currentHighBid' => (float) ($auction?->current_price ?? $bid->amount),
                'currentPrice' => (float) ($auction?->current_price ?? $bid->amount),
                'bidStatus' => $bidStatus,
                'isWinning' => (bool) $isWinning,
                'createdAt' => $bid->created_at?->toIso8601String(),
            ]);
        })->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage(),
                'per_page' => $bids->perPage(),
                'total' => $bids->total(),
            ]
        );
    }

    public function watchlist(Request $request): JsonResponse
    {
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $watchlist = $request->user()->watchedAuctions()
            ->with(['seller', 'category', 'media'])
            ->paginate($perPage);

        $formatted = collect($watchlist->items())->map(function ($auction) {
            $pivot = $auction->pivot;
            $auctionData = (new \App\Http\Resources\Auction\AuctionResource($auction))->resolve();
            return array_merge($auctionData, [
                'auction' => $auctionData,
                'notifyOnOutbid' => (bool) ($pivot?->notify_outbid ?? true),
                'notifyOutbid' => (bool) ($pivot?->notify_outbid ?? true),
                'notifyEndingSoon' => (bool) ($pivot?->notify_ending_soon ?? true),
                'notifyPriceDrop' => (bool) ($pivot?->notify_price_drop ?? true),
                'addedAt' => $pivot?->created_at?->toIso8601String() ?? $auction->created_at?->toIso8601String(),
            ]);
        })->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $watchlist->currentPage(),
                'last_page' => $watchlist->lastPage(),
                'per_page' => $watchlist->perPage(),
                'total' => $watchlist->total(),
            ]
        );
    }

    public function updateWatchlistPreferences(Request $request, string $auctionUuid): JsonResponse
    {
        $auction = \App\Models\Auction::where('uuid', $auctionUuid)->firstOrFail();
        $updates = [];
        if ($request->has('notifyOnOutbid') || $request->has('notifyOutbid')) {
            $updates['notify_outbid'] = $request->boolean('notifyOnOutbid', $request->boolean('notifyOutbid'));
        }
        if ($request->has('notifyEndingSoon')) {
            $updates['notify_ending_soon'] = $request->boolean('notifyEndingSoon');
        }
        if ($request->has('notifyPriceDrop')) {
            $updates['notify_price_drop'] = $request->boolean('notifyPriceDrop');
        }

        if (!empty($updates)) {
            $request->user()->watchedAuctions()->updateExistingPivot($auction->id, $updates);
        }

        return ApiResponse::success($updates, 'Watchlist preferences updated');
    }

    public function setDefaultAddress(Request $request, string $uuid): JsonResponse
    {
        $address = $request->user()->addresses()
            ->where(fn($q) => $q->where('uuid', $uuid)->orWhere('id', is_numeric($uuid) ? (int) $uuid : 0))
            ->firstOrFail();

        $request->user()->addresses()->update(['is_primary' => false]);
        $address->update(['is_primary' => true]);

        return ApiResponse::success($this->mapAddress($address->fresh()), 'Default address updated');
    }

    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->get()->map(fn($addr) => [
            'id' => $addr->id,
            'uuid' => $addr->uuid,
            'type' => $addr->type,
            'line1' => $addr->address_line_1,
            'line2' => $addr->address_line_2,
            'city' => $addr->city,
            'state' => $addr->state,
            'postalCode' => $addr->postal_code,
            'country' => $addr->country,
            'isDefault' => $addr->is_primary,
            'createdAt' => $addr->created_at,
        ]);
        return ApiResponse::success($addresses);
    }

    public function storeAddress(AddressRequest $request): JsonResponse
    {
        // If marking as default, unset others
        if ($request->boolean('isDefault')) {
            $request->user()->addresses()->update(['is_primary' => false]);
        }

        $address = $request->user()->addresses()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'type' => $request->input('type'),
            'address_line_1' => $request->input('line1'),
            'address_line_2' => $request->input('line2'),
            'city' => $request->input('city'),
            'state' => $request->input('state'),
            'postal_code' => $request->input('postalCode'),
            'country' => $request->input('country'),
            'is_primary' => $request->boolean('isDefault'),
        ]);

        return ApiResponse::success($this->mapAddress($address), 'Address added', 201);
    }

    public function updateAddress(AddressRequest $request, string $uuid): JsonResponse
    {
        $address = $request->user()->addresses()->where('uuid', $uuid)->firstOrFail();

        if ($request->boolean('isDefault')) {
            $request->user()->addresses()->update(['is_primary' => false]);
        }

        $address->update([
            'type' => $request->input('type'),
            'address_line_1' => $request->input('line1'),
            'address_line_2' => $request->input('line2'),
            'city' => $request->input('city'),
            'state' => $request->input('state'),
            'postal_code' => $request->input('postalCode'),
            'country' => $request->input('country'),
            'is_primary' => $request->boolean('isDefault'),
        ]);

        return ApiResponse::success($this->mapAddress($address), 'Address updated');
    }

    public function destroyAddress(Request $request, string $uuid): JsonResponse
    {
        $address = $request->user()->addresses()->where('uuid', $uuid)->firstOrFail();
        $address->delete();
        return ApiResponse::success(null, 'Address deleted');
    }

    protected function mapAddress($addr): array
    {
        return [
            'id' => $addr->id,
            'uuid' => $addr->uuid,
            'type' => $addr->type,
            'line1' => $addr->address_line_1,
            'line2' => $addr->address_line_2,
            'city' => $addr->city,
            'state' => $addr->state,
            'postalCode' => $addr->postal_code,
            'country' => $addr->country,
            'isDefault' => $addr->is_primary,
            'createdAt' => $addr->created_at,
        ];
    }

    public function requestDataExport(Request $request): JsonResponse
    {
        $this->accountService->requestDataExport($request->user());
        return ApiResponse::success(null, 'Data export request received. You will receive an email with a download link.');
    }

    public function closeAccount(CloseAccountRequest $request): JsonResponse
    {
        try {
            $this->accountService->closeAccount($request->user(), $request->input('confirmation_text'));
            return ApiResponse::success(null, 'Account closed. Your data will be retained for the legally required period.');
        } catch (\InvalidArgumentException $e) {
            return ApiResponse::error($e->getMessage(), 400);
        }
    }
}
