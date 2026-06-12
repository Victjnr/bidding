<?php

namespace App\Http\Controllers\Api\V1\Webhook;

use App\Http\Controllers\Controller;
use App\Jobs\Payment\UpdateTransactionStatusJob;
use App\Models\WebhookEvent;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class StripeWebhookController extends Controller
{
    public function handle(Request $request): JsonResponse
    {
        $payload = $request->all();
        $eventId = $payload['id'] ?? null;
        $type = $payload['type'] ?? null;

        if (!$eventId || !$type) {
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Idempotency check: if event already processed, return 200 immediately
        $event = WebhookEvent::firstOrCreate(
            ['provider_event_id' => $eventId],
            [
                'provider' => 'stripe',
                'type' => $type,
                'payload' => $payload,
            ]
        );

        if (!$event->wasRecentlyCreated) {
            return response()->json(['message' => 'Event already processed']);
        }

        // Dispatch based on type
        switch ($type) {
            case 'payment_intent.succeeded':
                UpdateTransactionStatusJob::dispatch($payload['data']['object']);
                break;
            
            case 'payment_intent.payment_failed':
                // MarkPaymentFailedJob::dispatch($payload['data']['object']);
                break;

            case 'charge.dispute.created':
                // CreateChargebackRecordJob::dispatch($payload['data']['object']);
                break;

            case 'transfer.created':
                // UpdatePayoutStatusJob::dispatch($payload['data']['object']);
                break;
                
            default:
                // Unhandled event type, just log it.
                break;
        }

        $event->update(['processed_at' => now()]);

        return response()->json(['status' => 'success']);
    }
}
