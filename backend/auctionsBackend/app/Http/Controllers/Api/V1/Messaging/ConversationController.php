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
        $conversations = $this->conversationRepository->getForUser($request->user()->id);
        return ApiResponse::success($conversations);
    }

    public function messages(Request $request, string $id): JsonResponse
    {
        $conversation = $this->conversationRepository->findByUuid($id);
        if (!$conversation) {
            return ApiResponse::error('Conversation not found', 404);
        }

        if ($conversation->buyer_id !== $request->user()->id && $conversation->seller_id !== $request->user()->id) {
            return ApiResponse::error('Unauthorized', 403);
        }

        $messages = $this->messageRepository->getForConversation($conversation->id);
        return ApiResponse::success($messages);
    }

    public function store(Request $request, string $id): JsonResponse
    {
        $request->validate(['body' => 'required|string|max:1000']);

        $conversation = $this->conversationRepository->findByUuid($id);
        if (!$conversation) {
            return ApiResponse::error('Conversation not found', 404);
        }

        if ($conversation->buyer_id !== $request->user()->id && $conversation->seller_id !== $request->user()->id) {
            return ApiResponse::error('Unauthorized', 403);
        }

        $message = $this->messageService->sendMessage($conversation, $request->user(), $request->input('body'));

        return ApiResponse::success($message, 'Message sent', 201);
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

        return ApiResponse::success([
            'conversation_uuid' => $conversation->uuid,
            'message' => $message,
        ], 'Conversation started', 201);
    }
}
