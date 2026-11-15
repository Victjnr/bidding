<?php

namespace App\Http\Controllers\Api\V1\Messaging;

use App\Contracts\Messaging\IConversationRepository;
use App\Contracts\Messaging\IMessageRepository;
use App\Contracts\Messaging\IMessageService;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Auction;
use App\Models\Conversation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function __construct(
        protected readonly IConversationRepository $conversationRepository,
        protected readonly IMessageRepository $messageRepository,
        protected readonly IMessageService $messageService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;
        $paginator = $this->conversationRepository->getForUser($userId);

        $formatted = collect($paginator->items())->map(fn ($conv) => $this->formatConversation($conv, $userId))->all();

        return ApiResponse::success($formatted);
    }

    public function messages(Request $request, string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);
        if (!$conversation) {
            return ApiResponse::error('Conversation not found', 404);
        }

        if ($conversation->buyer_id !== $request->user()->id && $conversation->seller_id !== $request->user()->id) {
            return ApiResponse::error('Unauthorized', 403);
        }

        $paginator = $this->messageRepository->getForConversation($conversation->id);
        $formatted = collect($paginator->items())->map(fn ($msg) => $this->formatMessage($msg, $conversation))->all();

        return ApiResponse::paginated(
            $formatted,
            [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ]
        );
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:1000']);

        $conversation = $this->findConversation($id);
        if (!$conversation) {
            return ApiResponse::error('Conversation not found', 404);
        }

        if ($conversation->buyer_id !== $request->user()->id && $conversation->seller_id !== $request->user()->id) {
            return ApiResponse::error('Unauthorized', 403);
        }

        $message = $this->messageService->sendMessage($conversation, $request->user(), $request->input('body'));
        $message->load('sender');

        return ApiResponse::success($this->formatMessage($message, $conversation), 'Message sent', 201);
    }

    public function create(Request $request): JsonResponse
    {
        $body = $request->input('initialMessage') ?? $request->input('body') ?? 'Hello!';
        $auctionUuid = $request->input('auctionUuid') ?? $request->input('auction_uuid');
        $recipientUuid = $request->input('recipientUuid') ?? $request->input('recipient_uuid');

        $auction = null;
        if ($auctionUuid) {
            $auction = Auction::where('uuid', $auctionUuid)->first();
        }

        $sellerId = $auction?->seller_id;
        if (!$sellerId && $recipientUuid) {
            $recipient = \App\Models\User::where('uuid', $recipientUuid)->first();
            $sellerId = $recipient?->id;
        }

        if (!$auction) {
            $auction = Auction::where('seller_id', $sellerId)->first() ?? Auction::first();
        }

        if (!$auction || !$sellerId) {
            return ApiResponse::error('Target auction or recipient not found.', 404);
        }

        if ($sellerId === $request->user()->id) {
            return ApiResponse::error('You cannot message yourself.', 400);
        }

        $conversation = $this->conversationRepository->firstOrCreate(
            auctionId: $auction->id,
            buyerId: $request->user()->id,
            sellerId: $sellerId
        );

        $this->messageService->sendMessage($conversation, $request->user(), $body);
        $conversation->load(['auction.media', 'buyer', 'seller', 'messages']);

        return ApiResponse::success(
            $this->formatConversation($conversation, $request->user()->id),
            'Conversation started',
            201
        );
    }

    public function markRead(Request $request, string $id): JsonResponse
    {
        $conversation = $this->findConversation($id);
        if ($conversation) {
            $conversation->messages()
                ->where('sender_id', '!=', $request->user()->id)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return ApiResponse::success(null, 'Conversation marked as read');
    }

    public function initiate(Request $request, string $uuid): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:1000']);

        $auction = Auction::where('uuid', $uuid)->firstOrFail();

        // Cannot message yourself
        if ($auction->seller_id === $request->user()->id) {
            return ApiResponse::error('You cannot message yourself.', 400);
        }

        $conversation = $this->conversationRepository->firstOrCreate(
            auctionId: $auction->id,
            buyerId: $request->user()->id,
            sellerId: $auction->seller_id
        );

        $message = $this->messageService->sendMessage($conversation, $request->user(), $request->input('body'));
        $conversation->load(['auction.media', 'buyer', 'seller', 'messages']);

        return ApiResponse::success([
            'conversation_uuid' => $conversation->uuid,
            'conversation' => $this->formatConversation($conversation, $request->user()->id),
            'message' => $this->formatMessage($message, $conversation),
        ], 'Conversation started', 201);
    }

    private function findConversation(string $id): ?Conversation
    {
        return Conversation::where('uuid', $id)
            ->when(is_numeric($id), fn ($q) => $q->orWhere('id', (int) $id))
            ->first();
    }

    private function formatConversation(Conversation $conv, int $currentUserId): array
    {
        $other = $conv->buyer_id === $currentUserId ? $conv->seller : $conv->buyer;
        $otherName = $other?->display_name ?: trim(($other?->first_name ?? '') . ' ' . ($other?->last_name ?? '')) ?: 'User';
        $lastMsg = $conv->messages?->first();
        $primaryMedia = $conv->auction?->media?->firstWhere('is_primary', true) ?? $conv->auction?->media?->first();
        $unreadCount = $conv->messages()
            ->where('sender_id', '!=', $currentUserId)
            ->where('is_read', false)
            ->count();

        $participantObj = [
            'uuid' => $other?->uuid ?? '',
            'displayName' => $otherName,
            'avatarUrl' => $other?->avatar_path,
            'isOnline' => true,
        ];
        $lastMessageAt = $lastMsg?->created_at?->toIso8601String() ?? $conv->updated_at?->toIso8601String();
        $lastMessageObj = $lastMsg ? [
            'body' => $lastMsg->body_sanitized ?? '',
            'senderId' => $lastMsg->sender?->uuid ?? (string) ($lastMsg->sender_id ?? ''),
            'sender_id' => $lastMsg->sender?->uuid ?? (string) ($lastMsg->sender_id ?? ''),
            'createdAt' => $lastMessageAt,
            'created_at' => $lastMessageAt,
        ] : null;

        return [
            'id' => $conv->uuid,
            'uuid' => $conv->uuid,
            'auction_id' => $conv->auction_id,
            'auctionUuid' => $conv->auction?->uuid,
            'auctionTitle' => $conv->auction?->title,
            'auctionThumbnail' => $primaryMedia?->url,
            'participant' => $participantObj,
            'participants' => [$participantObj],
            'lastMessage' => $lastMessageObj ?? [
                'body' => '',
                'senderId' => '',
                'createdAt' => $lastMessageAt,
            ],
            'last_message' => $lastMessageObj,
            'unreadCount' => $unreadCount,
            'unread_count' => $unreadCount,
            'updatedAt' => $conv->last_message_at?->toIso8601String() ?? $conv->updated_at?->toIso8601String(),
        ];
    }

    private function formatMessage(\App\Models\Message $msg, Conversation $conv): array
    {
        $sender = $msg->sender;
        $senderName = $sender?->display_name ?: trim(($sender?->first_name ?? '') . ' ' . ($sender?->last_name ?? '')) ?: 'User';
        $senderUuid = $sender?->uuid ?? (string) $msg->sender_id;
        $createdAt = $msg->created_at?->toIso8601String() ?? now()->toIso8601String();

        return [
            'id' => $msg->id,
            'uuid' => $msg->uuid,
            'conversationId' => $conv->uuid,
            'senderId' => $senderUuid,
            'sender_id' => $senderUuid,
            'senderName' => $senderName,
            'senderAvatar' => $sender?->avatar_path,
            'body' => $msg->body_sanitized,
            'isSanitized' => $msg->body_raw !== $msg->body_sanitized,
            'readAt' => $msg->is_read ? $msg->updated_at?->toIso8601String() : null,
            'createdAt' => $createdAt,
            'created_at' => $createdAt,
        ];
    }
}
