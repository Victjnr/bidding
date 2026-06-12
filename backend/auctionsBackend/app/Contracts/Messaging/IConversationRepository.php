<?php

namespace App\Contracts\Messaging;

use App\Models\Conversation;

interface IConversationRepository
{
    public function findByUuid(string $uuid): ?Conversation;
    public function firstOrCreate(int $auctionId, int $buyerId, int $sellerId): Conversation;
    public function getForUser(int $userId);
}
