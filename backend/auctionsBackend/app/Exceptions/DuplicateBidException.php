<?php

namespace App\Exceptions;

use Exception;

class DuplicateBidException extends Exception
{
    public function __construct(string $message = "You have already placed this identical bid.")
    {
        parent::__construct($message);
    }
}
