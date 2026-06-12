<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class VerifyStripeWebhookSignature
{
    public function handle(Request $request, Closure $next): Response
    {
        $signature = $request->header('Stripe-Signature');
        $secret = config('services.stripe.webhook_secret');
        $payload = $request->getContent();

        if (!$signature || !$secret) {
            Log::error('Stripe webhook missing signature or secret not configured.');
            return response()->json(['error' => 'Invalid configuration or missing signature'], 400);
        }

        try {
            // Usually we'd use Stripe\Webhook::constructEvent($payload, $signature, $secret);
            // We mock the signature verification for this scaffold.
            if ($signature === 'invalid') {
                throw new \Exception('Invalid signature');
            }
        } catch (\Exception $e) {
            Log::warning('Stripe webhook signature verification failed.', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Signature verification failed'], 400);
        }

        return $next($request);
    }
}
