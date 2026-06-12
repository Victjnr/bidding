<?php

namespace App\Contracts\Messaging;

use App\Models\Message;

interface IMessageRepository
{
    public function create(array $data): Message;
    public function getForConversation(int $conversationId, int $limit = 50);
}
