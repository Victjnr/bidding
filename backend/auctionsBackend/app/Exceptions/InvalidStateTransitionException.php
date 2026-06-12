<?php

namespace App\Exceptions;

use Exception;
use App\Enums\AuctionStatus;

class InvalidStateTransitionException extends Exception
{
    public function __construct(AuctionStatus $from, AuctionStatus $to)
    {
        parent::__construct("Invalid auction state transition from {$from->value} to {$to->value}.");
    }
}
