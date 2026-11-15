<?php

namespace App\Http\Resources\Auction;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuctionMediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $url = $this->file_path
            ? (str_starts_with($this->file_path, 'http') ? $this->file_path : url('/storage/' . ltrim($this->file_path, '/')))
            : 'https://placehold.co/600x400/EBF4FD/6B7A8D?text=Auction+Item';

        $thumbUrl = $this->thumb_path
            ? (str_starts_with($this->thumb_path, 'http') ? $this->thumb_path : url('/storage/' . ltrim($this->thumb_path, '/')))
            : $url;

        return [
            'id' => $this->id,
            'uuid' => $this->uuid ?? (string) $this->id,
            'url' => $url,
            'cdnUrl' => $url,
            'originalUrl' => $url,
            'thumbnailUrl' => $thumbUrl,
            'thumb_url' => $thumbUrl,
            'mimeType' => $this->mime_type ?? 'image/jpeg',
            'mime_type' => $this->mime_type ?? 'image/jpeg',
            'sizeBytes' => (int) ($this->size_bytes ?? 0),
            'isPrimary' => (bool) $this->is_primary,
            'is_primary' => (bool) $this->is_primary,
            'sortOrder' => (int) ($this->sort_order ?? 0),
            'sort_order' => (int) ($this->sort_order ?? 0),
            'processingStatus' => 'ready',
        ];
    }
}
