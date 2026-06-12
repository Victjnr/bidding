<?php

namespace App\Services\Messaging;

use App\Contracts\Messaging\IMessageRepository;
use App\Contracts\Messaging\IMessageService;
use App\Jobs\Messaging\FlaggedMessageReviewJob;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Str;

class MessageService implements IMessageService
{
    public function __construct(
        protected readonly IMessageRepository $messageRepository
    ) {}

    public function sendMessage(Conversation $conversation, User $sender, string $body): Message
    {
        // Security sanitization
        $clean = strip_tags($body); // No HTML in messages
        $clean = Str::limit($clean, 500, ''); // Max 500 chars

        // Flag if contains URLs, phone numbers, or email addresses
        // Regex looks for http/s, min 7 digits, or standard email format
        $isFlagged = (bool) preg_match("/(https?:\/\/|\b\d{7,}\b|[a-z0-9+_.-\]+@[a-z.-]+)/i", $clean);

        $message = $this->messageRepository->create([
            'conversation_id' => $conversation->id,
            'sender_id' => $sender->id,
            'body' => $clean,
            'is_flagged' => $isFlagged,
        ]);

        $conversation->update(['last_message_at' => now()]);

        if ($isFlagged) {
            FlaggedMessageReviewJob::dispatch($message);
        }

        // Normally we broadcast here on private-conversation.{id} channel
        // broadcast(new \App\Events\Messaging\MessageSent($message))->toOthers();

        return $message;
    }
}
