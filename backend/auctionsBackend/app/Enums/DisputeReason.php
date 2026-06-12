<?php

namespace App\Enums;

enum DisputeReason: string
{
    case NotReceived = 'not_received';
    case NotAsDescribed = 'not_as_described';
    case Fraud = 'fraud';
    case Other = 'other';
}
