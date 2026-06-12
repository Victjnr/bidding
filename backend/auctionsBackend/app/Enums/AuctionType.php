<?php

namespace App\Enums;

enum AuctionType: string
{
    case Forward = 'forward';
    case Reverse = 'reverse';
    case Sealed = 'sealed';
    case Penny = 'penny';
    case Bin = 'bin';
    case Live = 'live';
}
