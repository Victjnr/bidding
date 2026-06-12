<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use libphonenumber\PhoneNumberUtil;
use libphonenumber\NumberParseException;

class PhoneRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // Simple fallback if libphonenumber is not installed yet
        if (!class_exists(PhoneNumberUtil::class)) {
            if (!preg_match('/^\+[1-9]\d{1,14}$/', $value)) {
                $fail('The :attribute is not a valid E.164 phone number.');
            }
            return;
        }

        $phoneUtil = PhoneNumberUtil::getInstance();
        try {
            $numberProto = $phoneUtil->parse($value, null);
            if (!$phoneUtil->isValidNumber($numberProto)) {
                $fail('The :attribute is not a valid phone number.');
            }
        } catch (NumberParseException $e) {
            $fail('The :attribute is not a valid E.164 phone number.');
        }
    }
}
