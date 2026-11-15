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
        $perPage = (int) ($request->input('perPage') ?? $request->input('per_page') ?? 20);
        $query = $request->user()->notifications();
        if ($request->boolean('unreadOnly')) {
            $query->whereNull('read_at');
        }
        $notifications = $query->paginate($perPage);

        $formatted = collect($notifications->items())->map(function ($notif) {
            $data = is_array($notif->data) ? $notif->data : [];
            return [
                'id' => (string) $notif->id,
                'type' => $data['type'] ?? class_basename($notif->type),
                'title' => $data['title'] ?? 'Notification',
                'body' => $data['body'] ?? $data['message'] ?? '',
                'data' => $data,
                'readAt' => $notif->read_at?->toIso8601String(),
                'read_at' => $notif->read_at?->toIso8601String(),
                'createdAt' => $notif->created_at?->toIso8601String(),
                'created_at' => $notif->created_at?->toIso8601String(),
            ];
        })->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ]
        );
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->unreadCount($request->user());
        return ApiResponse::success([
            'count' => $count,
            'unread_count' => $count,
        ]);
    }

    public function markRead(Request $request, ?string $id = null): JsonResponse
    {
        $notificationId = $id ?? $request->input('id');
        if ($notificationId) {
            $notification = $request->user()->notifications()->where('id', $notificationId)->first();
            if ($notification) {
                $notification->markAsRead();
                \Illuminate\Support\Facades\Cache::forget("notif:unread:{$request->user()->id}");
            }
        }

        return ApiResponse::success(null, 'Notification marked as read');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        \Illuminate\Support\Facades\Cache::forget("notif:unread:{$request->user()->id}");

        return ApiResponse::success(null, 'All notifications marked as read');
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $incoming = $request->input('preferences') ?? $request->all();

        $user = $request->user();
        $merged = $this->normalizePreferences(array_merge(
            is_array($user->notification_preferences) ? $user->notification_preferences : [],
            is_array($incoming) ? $incoming : []
        ));

        if (\Illuminate\Support\Facades\Schema::hasColumn('users', 'notification_preferences')) {
            $user->update([
                'notification_preferences' => $merged,
            ]);
        }

        return ApiResponse::success($merged, 'Preferences updated');
    }

    public function getPreferences(Request $request): JsonResponse
    {
        $user = $request->user();
        $raw = \Illuminate\Support\Facades\Schema::hasColumn('users', 'notification_preferences')
            ? $user->notification_preferences
            : [];
        return ApiResponse::success($this->normalizePreferences($raw), 'Preferences retrieved');
    }

    private function normalizePreferences($prefs): array
    {
        $defaults = [
            'emailOutbid' => true,
            'pushOutbid' => true,
            'smsOutbid' => false,
            'emailEndingSoon' => true,
            'pushEndingSoon' => true,
            'emailWon' => true,
            'pushWon' => true,
            'emailPaymentDue' => true,
            'emailMarketing' => false,
        ];

        if (!is_array($prefs)) {
            return $defaults;
        }

        return array_merge($defaults, array_intersect_key($prefs, $defaults));
    }
}
