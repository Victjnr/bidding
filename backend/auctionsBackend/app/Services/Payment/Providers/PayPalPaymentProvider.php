<?php

namespace App\Services\Payment\Providers;

use App\Contracts\Payment\IPaymentProvider;

class PayPalPaymentProvider implements IPaymentProvider
{
    public function createPaymentIntent(float $amount, string $currency, array $metadata = []): array
    {
        return [
            'id' => 'PAYID-' . strtoupper(uniqid()),
            'client_secret' => null, // PayPal uses redirect flows or SDK
        ];
    }

    public function capturePaymentIntent(string $intentId): bool
    {
        return true;
    }

    public function refund(string $intentId, float $amount): bool
    {
        return true;
    }

    public function createPayout(float $amount, string $currency, string $destination): string
    {
        return 'PAYOUT-' . strtoupper(uniqid());
    }
}
