<?php

namespace App\Enums;

enum KycDocumentType: string
{
    case NationalId = 'national_id';
    case IdCard = 'id_card';
    case Passport = 'passport';
    case DriversLicense = 'drivers_license';
    case UtilityBill = 'utility_bill';
    case ProofOfAddress = 'proof_of_address';
    case Selfie = 'selfie';

    public function label(): string
    {
        return match($this) {
            self::NationalId, self::IdCard => 'National ID / ID Card',
            self::Passport => 'Passport',
            self::DriversLicense => 'Driver\'s License',
            self::UtilityBill, self::ProofOfAddress => 'Proof of Address',
            self::Selfie => 'Selfie',
        };
    }
}
