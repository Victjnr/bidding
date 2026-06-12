<?php

namespace App\Services\Payment;

use App\Contracts\Payment\IPaymentProvider;
use App\Services\Payment\Providers\PayPalPaymentProvider;
use App\Services\Payment\Providers\StripePaymentProvider;
use InvalidArgumentException;

class PaymentProviderFactory
{
    public static function make(string $provider): IPaymentProvider
    {
        return match ($provider) {
            'stripe' => app(StripePaymentProvider::class),
            'paypal' => app(PayPalPaymentProvider::class),
            default => throw new InvalidArgumentException("Unsupported payment provider: {$provider}"),
        };
    }
}
