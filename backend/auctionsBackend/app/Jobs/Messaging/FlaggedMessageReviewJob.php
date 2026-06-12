<?php

namespace App\Jobs\Messaging;

use App\Models\Message;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class FlaggedMessageReviewJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Message $message
    ) {}

    public function handle(): void
    {
        // This could notify administrators or push the message to an admin queue for review
        Log::info("Message ID {$this->message->id} was flagged for review due to potential off-platform links or contact info.", [
            'conversation_id' => $this->message->conversation_id,
            'sender_id' => $this->message->sender_id,
        ]);
        
        // E.g., send an email to admins
    }
}
