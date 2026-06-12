<?php

namespace App\Exceptions;

use Exception;

class CannotBidOwnAuctionException extends Exception
{
    public function __construct(string $message = "You cannot bid on your own auction.")
    {
        parent::__construct($message);
    }
}
