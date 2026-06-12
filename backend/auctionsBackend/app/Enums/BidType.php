<?php

namespace App\Enums;

enum BidType: string
{
    case Manual = 'manual';
    case Proxy = 'proxy';
    case Automatic = 'automatic';
}
