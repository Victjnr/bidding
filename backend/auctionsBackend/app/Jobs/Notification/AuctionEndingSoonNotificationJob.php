<?php

namespace App\Jobs\Notification;

use App\Contracts\Notification\INotificationService;
use App\DTOs\Notification\NotificationDTO;
use App\Enums\NotificationType;
use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class AuctionEndingSoonNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Auction $auction,
        public string $timeLeft
    ) {}

    public function handle(INotificationService $notificationService): void
    {
        // Find all unique bidders for this auction to notify them
        $bidders = $this->auction->bids()->select('user_id')->distinct()->pluck('user_id');

        foreach ($bidders as $userId) {
            $notificationService->dispatch(new NotificationDTO(
                userId: $userId,
                type: NotificationType::AuctionEndingSoon,
                data: [
                    'auctionUuid' => $this->auction->uuid,
                    'auctionTitle' => $this->auction->title,
                    'timeLeft' => $this->timeLeft,
                ]
            ));
        }

        // We could also notify the seller
        $notificationService->dispatch(new NotificationDTO(
            userId: $this->auction->seller_id,
            type: NotificationType::AuctionEndingSoon,
            data: [
                'auctionUuid' => $this->auction->uuid,
                'auctionTitle' => $this->auction->title,
                'timeLeft' => $this->timeLeft,
            ]
        ));
    }
}
