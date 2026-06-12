<?php

namespace App\Enums;

enum TransactionStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case Completed = 'completed';
    case Failed = 'failed';
    case Disputed = 'disputed';
    case Refunded = 'refunded';
}
