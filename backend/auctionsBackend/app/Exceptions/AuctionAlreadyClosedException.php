<?php

namespace App\Exceptions;

use Exception;

class AuctionAlreadyClosedException extends Exception
{
    public function __construct(string $message = "This auction is already closed.")
    {
        parent::__construct($message);
    }
}
