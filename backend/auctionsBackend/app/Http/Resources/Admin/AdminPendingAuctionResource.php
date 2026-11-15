<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminPendingAuctionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $firstMedia = $this->media?->first();
        $imageUrl = $firstMedia?->file_path
            ? (str_starts_with($firstMedia->file_path, 'http') ? $firstMedia->file_path : url('/storage/' . ltrim($firstMedia->file_path, '/')))
            : null;

        $rawStatus = $this->status instanceof \BackedEnum ? $this->status->value : (string) $this->status;
        $moderationStatus = match ($rawStatus) {
            'pending', 'draft' => 'pending',
            'active', 'scheduled', 'extended', 'closing', 'sold', 'ended' => 'approved',
            'cancelled', 'disputed', 'no_sale' => 'rejected',
            default => $rawStatus,
        };

        return [
            'uuid' => $this->uuid,
            'title' => $this->title,
            'sellerName' => $this->seller ? ($this->seller->display_name ?: trim("{$this->seller->first_name} {$this->seller->last_name}")) : 'Unknown Seller',
            'sellerUuid' => $this->seller?->uuid ?? '',
            'category' => $this->category ? $this->category->name : 'Uncategorized',
            'reservePrice' => $this->reserve_price !== null ? (float) $this->reserve_price : null,
            'startPrice' => (float) ($this->start_price ?? 0),
            'imageUrl' => $imageUrl,
            'submittedAt' => $this->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'status' => $moderationStatus,
            'rawStatus' => $rawStatus,
        ];
    }
}
