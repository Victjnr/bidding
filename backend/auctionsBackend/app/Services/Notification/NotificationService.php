<?php

namespace App\Services\Notification;

use App\Contracts\Notification\INotificationService;
use App\DTOs\Notification\NotificationDTO;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Notification;

class NotificationService implements INotificationService
{
    public function dispatch(NotificationDTO $dto): void
    {
        $user = User::find($dto->userId);
        if (!$user) return;

        $className = 'App\\Notifications\\' . str_replace(' ', '', ucwords(str_replace('_', ' ', $dto->type->value))) . 'Notification';

        if (class_exists($className)) {
            $notificationInstance = new $className($dto->data);
            $user->notify($notificationInstance);
            Cache::forget("notif:unread:{$user->id}");
        }
    }

    public function unreadCount(User $user): int
    {
        return (int) Cache::remember("notif:unread:{$user->id}", 60, function () use ($user) {
            return $user->unreadNotifications()->count();
        });
    }
}
