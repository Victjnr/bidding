<?php

namespace App\Contracts\Payment;

interface IPaymentProvider
{
    /**
     * Create a payment intent (e.g. for Stripe) and return the intent ID/client secret.
     */
    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): array;

    /**
     * Capture a previously created payment intent.
     */
    public function capturePaymentIntent(string $intentId): bool;

    /**
     * Refund a captured payment.
     */
    public function refund(string $intentId, float $amount): bool;

    /**
     * Create a payout to a destination account.
     */
    public function createPayout(float $amount, string $currency, string $destination): string;
}
