<?php

namespace App\Exceptions;

use Exception;

class InsufficientFundsException extends Exception
{
    public function __construct(string $message = "You have insufficient funds to perform this action.")
    {
        parent::__construct($message);
    }
}
