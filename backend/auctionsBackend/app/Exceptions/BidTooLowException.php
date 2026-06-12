<?php

namespace App\Exceptions;

use Exception;

class BidTooLowException extends Exception
{
    public function __construct(string $message = "The bid amount is too low.")
    {
        parent::__construct($message);
    }
}
