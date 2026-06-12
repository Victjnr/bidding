<?php

namespace App\Enums;

enum UserStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
    case Banned = 'banned';
    case PendingKyc = 'pending_kyc';

    public function label(): string
    {
        return match($this) {
            self::Active => 'Active',
            self::Suspended => 'Suspended',
            self::Banned => 'Banned',
            self::PendingKyc => 'Pending KYC',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Active => 'success',
            self::Suspended => 'warning',
            self::Banned => 'danger',
            self::PendingKyc => 'info',
        };
    }

    public function canBid(): bool
    {
        return match($this) {
            self::Active => true,
            default => false,
        };
    }

    public function canSell(): bool
    {
        return match($this) {
            self::Active => true,
            default => false,
        };
    }
}
