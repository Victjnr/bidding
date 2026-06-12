<?php

namespace App\Notifications;

use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OutbidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public array $data
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'broadcast', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $auctionTitle = $this->data['auctionTitle'] ?? 'an auction';
        $currentBid = $this->data['currentBid'] ?? 0;
        $url = $this->data['link'] ?? url('/');

        return (new MailMessage)
            ->subject("You've been outbid on {$auctionTitle}")
            ->markdown('emails.layouts.branded', [
                'header' => 'Outbid Alert',
                'body' => "You have been outbid! The current highest bid is now **$" . number_format($currentBid, 2) . "**.",
                'actionText' => 'Bid Again',
                'actionUrl' => $url,
            ]);
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'outbid',
            'auctionUuid' => $this->data['auctionUuid'] ?? '',
            'auctionTitle' => $this->data['auctionTitle'] ?? '',
            'currentBid' => $this->data['currentBid'] ?? 0,
            'link' => $this->data['link'] ?? '',
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }

    public function broadcastOn()
    {
        return [new \Illuminate\Broadcasting\PrivateChannel("notifications.{$this->id}")]; // Note: Laravel docs suggest channels() method usually on Event, but broadcastOn on Notification
    }
}
