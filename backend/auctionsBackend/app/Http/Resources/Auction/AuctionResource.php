<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class AuctionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $cleanDescription = strip_tags(
            (string) $this->description,
            '<p><br><b><i><strong><em><ul><ol><li><h1><h2><h3><h4><blockquote><code><pre>'
        );

        $isReserveMet = $this->reserve_price !== null
            ? (float) $this->current_price >= (float) $this->reserve_price
            : true;

        $isWatched = $user !== null
            ? ($user->watchedAuctions()->where('auction_id', $this->id)->exists())
            : false;

        $locationStr = implode(', ', array_filter([$this->location_city, $this->location_country])) ?: 'Global';
        $incrementValue = (float) ($this->bid_increment_value ?: 10);
        $currentPrice = (float) ($this->current_price ?? $this->start_price ?? 0);
        $startPrice = (float) ($this->start_price ?? 0);
        $reservePrice = $this->reserve_price !== null ? (float) $this->reserve_price : null;
        $binPrice = $this->bin_price !== null ? (float) $this->bin_price : null;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'title' => $this->title,
            'slug' => Str::slug($this->title) . '-' . substr($this->uuid, 0, 8),
            'description' => $cleanDescription,
            'condition' => $this->condition ?? 'new',
            // Frontend expects string auctionType & status, while some backend consumers check snake_case
            'auctionType' => $this->auction_type?->value ?? 'forward',
            'auction_type' => [
                'value' => $this->auction_type?->value ?? 'forward',
                'label' => $this->auction_type?->name ?? 'Forward',
            ],
            'status' => $this->status?->value ?? 'draft',
            'status_info' => [
                'value' => $this->status?->value ?? 'draft',
                'label' => $this->status?->label() ?? 'Draft',
            ],
            'status_color' => $this->status?->color() ?? 'gray',
            'currency' => $this->currency_code ?? 'USD',
            'currency_code' => $this->currency_code ?? 'USD',
            'currentPrice' => $currentPrice,
            'current_price' => $currentPrice,
            'startPrice' => $startPrice,
            'start_price' => $startPrice,
            'reservePrice' => $reservePrice,
            'reserve_price' => $reservePrice,
            'isReserveMet' => $isReserveMet,
            'reserveMet' => $isReserveMet,
            'is_reserve_met' => $isReserveMet,
            'buyNowPrice' => $binPrice,
            'bin_price' => $binPrice,
            'minBidIncrement' => $incrementValue,
            'next_minimum_bid' => $currentPrice + $incrementValue,
            'bid_increment' => [
                'type' => $this->bid_increment_type ?? 'fixed',
                'value' => $incrementValue,
            ],
            'autoExtend' => (int) ($this->anti_snipe_minutes ?? 0) > 0,
            'autoExtendMinutes' => (int) ($this->anti_snipe_extend_minutes ?? 5),
            'extensionWindowMinutes' => (int) ($this->anti_snipe_minutes ?? 5),
            'maxExtensions' => 5,
            'extensionsCount' => 0,
            'totalBids' => (int) ($this->total_bids ?? 0),
            'total_bids' => (int) ($this->total_bids ?? 0),
            'time_remaining_seconds' => $this->end_at
                ? max(0, now()->diffInSeconds($this->end_at, false))
                : null,
            'startAt' => $this->start_at?->toIso8601String() ?? $this->created_at?->toIso8601String(),
            'endAt' => $this->end_at?->toIso8601String(),
            'ends_at' => $this->end_at?->toIso8601String(),
            'closedAt' => in_array($this->status?->value, ['ended', 'sold', 'no_sale', 'cancelled'])
                ? $this->updated_at?->toIso8601String()
                : null,
            'location' => $locationStr,
            'location_details' => [
                'country' => $this->location_country,
                'city' => $this->location_city,
            ],
            'tags' => [],
            'shippingInfo' => null,
            'deposit' => [
                'required' => (bool) $this->deposit_required,
                'amount' => $this->deposit_amount ? (float) $this->deposit_amount : null,
            ],
            'seller' => $this->relationLoaded('seller') && $this->seller
                ? new UserMinimalResource($this->seller)
                : [
                    'id' => $this->seller_id,
                    'uuid' => $this->seller?->uuid ?? '',
                    'displayName' => $this->seller?->display_name ?? 'Verified Seller',
                    'display_name' => $this->seller?->display_name ?? 'Verified Seller',
                    'avatarPath' => $this->seller?->avatar_path,
                    'trustScore' => $this->seller?->trust_score ?? 100,
                ],
            'category' => $this->relationLoaded('category') && $this->category
                ? new CategoryResource($this->category)
                : [
                    'id' => $this->category_id,
                    'name' => $this->category?->name ?? 'General',
                    'slug' => $this->category?->slug ?? 'general',
                ],
            'media' => $this->relationLoaded('media')
                ? AuctionMediaResource::collection($this->media->sortBy('sort_order'))
                : [],
            'winner' => $this->relationLoaded('winner') && $this->winner
                ? new UserMinimalResource($this->winner)
                : null,
            'isWatched' => $isWatched,
            'is_watching' => $isWatched,
            'isFeatured' => (bool) ($this->is_featured ?? false),
            'watchersCount' => (int) ($this->watchers_count ?? 0),
            'watch_count' => (int) ($this->watchers_count ?? 0),
            'viewsCount' => (int) ($this->views_count ?? 0),
            'views_count' => (int) ($this->views_count ?? 0),
            'createdAt' => $this->created_at?->toIso8601String(),
            'updatedAt' => $this->updated_at?->toIso8601String(),
        ];
    }
}
