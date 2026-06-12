<?php

namespace App\Repositories\Messaging;

use App\Contracts\Messaging\IMessageRepository;
use App\Models\Message;

class MessageRepository implements IMessageRepository
{
    public function create(array $data): Message
    {
        return Message::create($data);
    }

    public function getForConversation(int $conversationId, int $limit = 50)
    {
        return Message::where('conversation_id', $conversationId)
            ->with('sender:id,first_name,last_name')
            ->latest()
            ->paginate($limit);
    }
}
