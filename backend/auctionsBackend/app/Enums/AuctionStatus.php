<?php

namespace App\Enums;

enum AuctionStatus: string
{
    case Draft = 'draft';
    case Pending = 'pending';
    case Scheduled = 'scheduled';
    case Active = 'active';
    case Extended = 'extended';
    case Closing = 'closing';
    case Ended = 'ended';
    case Sold = 'sold';
    case NoSale = 'no_sale';
    case Cancelled = 'cancelled';
    case Disputed = 'disputed';

    public function label(): string
    {
        return match($this) {
            self::Draft => 'Draft',
            self::Pending => 'Pending Review',
            self::Scheduled => 'Scheduled',
            self::Active => 'Active',
            self::Extended => 'Extended',
            self::Closing => 'Closing',
            self::Ended => 'Ended',
            self::Sold => 'Sold',
            self::NoSale => 'No Sale',
            self::Cancelled => 'Cancelled',
            self::Disputed => 'Disputed',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Draft, self::Pending => 'secondary',
            self::Scheduled => 'info',
            self::Active, self::Extended, self::Closing => 'primary',
            self::Sold => 'success',
            self::NoSale, self::Cancelled, self::Disputed => 'danger',
            self::Ended => 'warning',
        };
    }

    public function isEditable(): bool
    {
        return match($this) {
            self::Draft, self::Pending, self::Scheduled => true,
            default => false,
        };
    }

    public function isBiddable(): bool
    {
        return match($this) {
            self::Active, self::Extended, self::Closing => true,
            default => false,
        };
    }

    public function isFinal(): bool
    {
        return match($this) {
            self::Sold, self::NoSale, self::Cancelled => true,
            default => false,
        };
    }
}
