<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuctionEndingSoonNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $data
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast'];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'auction_ending_soon',
            'auctionUuid' => $this->data['auctionUuid'] ?? '',
            'auctionTitle' => $this->data['auctionTitle'] ?? '',
            'timeLeft' => $this->data['timeLeft'] ?? 'soon',
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
