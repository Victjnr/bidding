<?php

namespace App\DTOs\Notification;

use App\Enums\NotificationType;

readonly class NotificationDTO
{
    public function __construct(
        public int $userId,
        public NotificationType $type,
        public array $data = []
    ) {}
}
