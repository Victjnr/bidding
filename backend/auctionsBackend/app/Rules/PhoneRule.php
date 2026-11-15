<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use libphonenumber\PhoneNumberUtil;
use libphonenumber\NumberParseException;

class PhoneRule implements ValidationRule
{
    /**
     * Default region for parsing local phone numbers (ISO 3166-1 alpha-2).
     * Accepts formats like: 0784990053, +263784990053, 263784990053
     */
    private const DEFAULT_REGION = 'ZW';

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (empty($value) || (is_string($value) && trim($value) === '')) {
            return;
        }

        $value = trim($value);

        // Simple fallback if libphonenumber is not installed yet
        if (!class_exists(PhoneNumberUtil::class)) {
            // Accept local formats (07x), E.164 (+263...), or bare international (263...)
            if (!preg_match('/^(?:\+?[1-9]\d{1,14}|0\d{9,10})$/', $value)) {
                $fail('The :attribute is not a valid phone number. Enter a local number (e.g. 0784990053) or international format (+263784990053).');
            }
            return;
        }

        $phoneUtil = PhoneNumberUtil::getInstance();
        try {
            $numberProto = $phoneUtil->parse($value, self::DEFAULT_REGION);
            if (!$phoneUtil->isValidNumber($numberProto)) {
                $fail('The :attribute is not a valid phone number. Enter a local number (e.g. 0784990053) or international format (+263784990053).');
            }
        } catch (NumberParseException $e) {
            $fail('The :attribute is not a valid phone number. Enter a local number (e.g. 0784990053) or international format (+263784990053).');
        }
    }
}
