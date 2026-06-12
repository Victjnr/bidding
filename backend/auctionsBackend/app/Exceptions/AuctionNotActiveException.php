<?php

namespace App\Exceptions;

use Exception;

class AuctionNotActiveException extends Exception
{
    public function __construct(string $message = "This auction is not currently active.")
    {
        parent::__construct($message);
    }
}
