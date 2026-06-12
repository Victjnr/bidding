<?php

namespace App\Http\Controllers\Api\V1\Notification;

use App\Contracts\Notification\INotificationService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        protected readonly INotificationService $notificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()->notifications()->paginate(20);

        return ApiResponse::success($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->unreadCount($request->user());
        return ApiResponse::success(['unread_count' => $count]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $request->validate(['id' => 'required|string']);

        $notification = $request->user()->notifications()->where('id', $request->input('id'))->first();
        if ($notification) {
            $notification->markAsRead();
            \Illuminate\Support\Facades\Redis::del("notif:unread:{$request->user()->id}");
        }

        return ApiResponse::success(null, 'Notification marked as read');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        \Illuminate\Support\Facades\Redis::del("notif:unread:{$request->user()->id}");

        return ApiResponse::success(null, 'All notifications marked as read');
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $request->validate([
            'preferences' => 'required|array',
        ]);

        // Assuming User model has a json column for notification_preferences
        $user = $request->user();
        $user->update([
            'notification_preferences' => $request->input('preferences'),
        ]);

        return ApiResponse::success($user->notification_preferences, 'Preferences updated');
    }
}
