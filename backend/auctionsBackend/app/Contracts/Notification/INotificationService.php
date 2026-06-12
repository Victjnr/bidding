<?php

namespace App\Contracts\Notification;

use App\DTOs\Notification\NotificationDTO;
use App\Models\User;

interface INotificationService
{
    public function dispatch(NotificationDTO $dto): void;
    public function unreadCount(User $user): int;
}
