<?php

namespace App\Contracts\Messaging;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;

interface IMessageService
{
    public function sendMessage(Conversation $conversation, User $sender, string $body): Message;
}
