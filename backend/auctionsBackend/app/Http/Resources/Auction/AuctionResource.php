<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'description' => clean($this->description), // HTMLPurifier via mews/purifier helper
            'auction_type' => [
                'value' => $this->auction_type->value,
                'label' => $this->auction_type->name,
            ],
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
            ],
            'status_color' => $this->status->color(),
            'current_price' => $this->current_price,
            'start_price' => $this->start_price,
            'reserve_price' => $this->when(
                $user && $user->id === $this->seller_id,
                $this->reserve_price
            ),
            'is_reserve_met' => $this->reserve_price !== null
                ? $this->current_price >= $this->reserve_price
                : null,
            'bin_price' => $this->bin_price,
            'next_minimum_bid' => $this->current_price + $this->bid_increment_value,
            'bid_increment' => [
                'type' => $this->bid_increment_type,
                'value' => $this->bid_increment_value,
            ],
            'total_bids' => $this->total_bids ?? 0,
            'time_remaining_seconds' => $this->end_at
                ? max(0, now()->diffInSeconds($this->end_at, false))
                : null,
            'ends_at' => $this->end_at?->toIso8601String(),
            'condition' => $this->condition,
            'location' => [
                'country' => $this->location_country,
                'city' => $this->location_city,
            ],
            'currency_code' => $this->currency_code,
            'deposit' => [
                'required' => $this->deposit_required,
                'amount' => $this->deposit_amount,
            ],
            'seller' => $this->whenLoaded('seller', function () {
                return new UserMinimalResource($this->seller);
            }),
            'category' => $this->whenLoaded('category', function () {
                return new CategoryResource($this->category);
            }),
            'media' => $this->whenLoaded('media', function () {
                return AuctionMediaResource::collection(
                    $this->media->sortBy('sort_order')
                );
            }),
            'is_watching' => $this->when(
                $user !== null,
                fn () => $user?->watchedAuctions()?->where('auction_id', $this->id)->exists() ?? false
            ),
            'watch_count' => $this->watchers_count ?? 0,
            'views_count' => $this->views_count ?? 0,
        ];
    }
}
