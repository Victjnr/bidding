<?php

namespace App\Exceptions;

use Exception;

class KycTierInsufficientException extends Exception
{
    public function __construct(string $message = "Your KYC tier is insufficient for this action.")
    {
        parent::__construct($message);
    }
}
