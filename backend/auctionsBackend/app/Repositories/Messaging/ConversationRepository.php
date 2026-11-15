<?php

namespace App\Repositories\Messaging;

use App\Contracts\Messaging\IConversationRepository;
use App\Models\Conversation;

class ConversationRepository implements IConversationRepository
{
    public function findByUuid(string $uuid): ?Conversation
    {
        return Conversation::where('uuid', $uuid)->first();
    }

    public function firstOrCreate(int $auctionId, int $buyerId, int $sellerId): Conversation
    {
        return Conversation::firstOrCreate([
            'auction_id' => $auctionId,
            'buyer_id' => $buyerId,
            'seller_id' => $sellerId,
        ]);
    }

    public function getForUser(int $userId)
    {
        return Conversation::where(function ($q) use ($userId) {
                $q->where('buyer_id', $userId)
                  ->orWhere('seller_id', $userId);
            })
            ->with([
                'auction.media',
                'buyer:id,uuid,first_name,last_name,display_name,avatar_path',
                'seller:id,uuid,first_name,last_name,display_name,avatar_path',
                'messages' => fn($q) => $q->latest()->limit(1),
            ])
            ->orderByDesc('last_message_at')
            ->paginate(20);
    }
}
