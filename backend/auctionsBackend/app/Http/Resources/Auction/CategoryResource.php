<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid ?? (string) $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'icon' => $this->icon,
            'parentId' => $this->parent_id,
            'sortOrder' => (int) ($this->sort_order ?? 0),
            'auctionsCount' => (int) ($this->auctions_count ?? 0),
        ];
    }
}
