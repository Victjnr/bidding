<?php

namespace App\Enums;

enum KycDocumentType: string
{
    case NationalId = 'national_id';
    case Passport = 'passport';
    case DriversLicense = 'drivers_license';
    case UtilityBill = 'utility_bill';
    case Selfie = 'selfie';

    public function label(): string
    {
        return match($this) {
            self::NationalId => 'National ID',
            self::Passport => 'Passport',
            self::DriversLicense => 'Driver\'s License',
            self::UtilityBill => 'Utility Bill',
            self::Selfie => 'Selfie',
        };
    }
}
