<?php

namespace App\Services\Payment\Providers;

use App\Contracts\Payment\IPaymentProvider;

class StripePaymentProvider implements IPaymentProvider
{
    // Note: In a real implementation, we would inject the StripeClient or use Cashier

    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): array
    {
        // Mock Stripe API call
        return [
            'id' => 'pi_' . uniqid(),
            'client_secret' => 'seti_' . uniqid() . '_secret_' . uniqid(),
        ];
    }

    public function capturePaymentIntent(string $intentId): bool
    {
        // Mock capture success
        return true;
    }

    public function refund(string $intentId, float $amount): bool
    {
        // Mock refund success
        return true;
    }

    public function createPayout(float $amount, string $currency, string $destination): string
    {
        // Mock payout creation
        return 'po_' . uniqid();
    }
}
