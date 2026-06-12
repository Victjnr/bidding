<?php

namespace App\Exceptions;

use Exception;

class TooManyBidsException extends Exception
{
    public function __construct()
    {
        parent::__construct('Rate limit exceeded. Maximum 30 bids per minute.');
    }
}
