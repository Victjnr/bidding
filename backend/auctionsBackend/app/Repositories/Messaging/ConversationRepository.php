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
        return Conversation::where('buyer_id', $userId)
            ->orWhere('seller_id', $userId)
            ->with(['auction:id,title', 'buyer:id,first_name,last_name', 'seller:id,first_name,last_name'])
            ->orderByDesc('last_message_at')
            ->paginate(20);
    }
}
