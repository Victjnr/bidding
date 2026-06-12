<?php

namespace App\Services\Notification;

use App\Contracts\Notification\INotificationService;
use App\DTOs\Notification\NotificationDTO;
use App\Models\User;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Notification;

class NotificationService implements INotificationService
{
    public function dispatch(NotificationDTO $dto): void
    {
        $user = User::find($dto->userId);
        if (!$user) return;

        // In a real app, you'd resolve the correct notification class dynamically based on type.
        // E.g., App\Notifications\{$type->value}Notification
        $className = 'App\\Notifications\\' . str_replace(' ', '', ucwords(str_replace('_', ' ', $dto->type->value))) . 'Notification';

        if (class_exists($className)) {
            // Retrieve notification preferences
            // If they opted out of a certain channel for this type, you'd filter it in the Notification class via() method
            $notificationInstance = new $className($dto->data);
            
            // Dispatch via Laravel's native notification system which handles queueing
            $user->notify($notificationInstance);
            
            // Clear unread count cache
            Redis::del("notif:unread:{$user->id}");
        }
    }

    public function unreadCount(User $user): int
    {
        return Redis::remember("notif:unread:{$user->id}", 60, function () use ($user) {
            return $user->unreadNotifications()->count();
        });
    }
}
