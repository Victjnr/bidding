<?php

namespace App\Exceptions;

use Exception;

class DisputeWindowExpiredException extends Exception
{
    public function __construct(string $message = "The window to open a dispute has expired.")
    {
        parent::__construct($message);
    }
}
