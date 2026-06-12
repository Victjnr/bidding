<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuctionWonNotification extends Notification implements ShouldQueue
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
        $winningBid = $this->data['winningBid'] ?? 0;
        $uuid = $this->data['auctionUuid'] ?? '';
        $url = url("/app/transactions/{$uuid}/pay"); // Front-end pay route

        return (new MailMessage)
            ->subject("Congratulations! You won {$auctionTitle}")
            ->markdown('emails.layouts.branded', [
                'header' => 'Auction Won!',
                'body' => "Congratulations, you are the winning bidder with a final bid of **$" . number_format($winningBid, 2) . "**.",
                'actionText' => 'Complete Payment',
                'actionUrl' => $url,
            ]);
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'won',
            'auctionUuid' => $this->data['auctionUuid'] ?? '',
            'auctionTitle' => $this->data['auctionTitle'] ?? '',
            'winningBid' => $this->data['winningBid'] ?? 0,
            'link' => url("/app/transactions/{$this->data['auctionUuid'] ?? ''}/pay"),
        ];
    }

    public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toArray($notifiable));
    }
}
