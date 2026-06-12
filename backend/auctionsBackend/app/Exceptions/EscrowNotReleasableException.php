<?php

namespace App\Exceptions;

use Exception;

class EscrowNotReleasableException extends Exception
{
    public function __construct(string $message = "The escrow cannot be released at this time.")
    {
        parent::__construct($message);
    }
}
