<?php

namespace App\Enums;

enum TransactionType: string
{
    case Charge = 'charge';
    case Refund = 'refund';
    case Payout = 'payout';
    case DepositHold = 'deposit_hold';
    case DepositRelease = 'deposit_release';
    case Commission = 'commission';
}
