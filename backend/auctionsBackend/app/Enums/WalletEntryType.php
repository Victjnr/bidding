<?php

namespace App\Enums;

enum WalletEntryType: string
{
    case Credit = 'credit';
    case Debit = 'debit';
    case Hold = 'hold';
    case Release = 'release';
}
