<?php

namespace App\Exceptions;

use Exception;

class PaymentCapturedException extends Exception
{
    public function __construct(string $message = "Payment has already been captured for this transaction.")
    {
        parent::__construct($message);
    }
}
