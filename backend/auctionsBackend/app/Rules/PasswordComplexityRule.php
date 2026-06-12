<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class PasswordComplexityRule implements ValidationRule
{
    /**
     * Enforce: ≥12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (strlen($value) < 12) {
            $fail('The password must be at least 12 characters.');
            return;
        }

        if (!preg_match('/[A-Z]/', $value)) {
            $fail('The password must contain at least one uppercase letter.');
            return;
        }

        if (!preg_match('/[a-z]/', $value)) {
            $fail('The password must contain at least one lowercase letter.');
            return;
        }

        if (!preg_match('/[0-9]/', $value)) {
            $fail('The password must contain at least one digit.');
            return;
        }

        if (!preg_match('/[^A-Za-z0-9]/', $value)) {
            $fail('The password must contain at least one special character.');
            return;
        }

        // HaveIBeenPwned check
        $hash = strtoupper(sha1($value));
        $prefix = substr($hash, 0, 5);
        $suffix = substr($hash, 5);

        try {
            $response = \Illuminate\Support\Facades\Http::timeout(3)->get("https://api.pwnedpasswords.com/range/{$prefix}");
            if ($response->successful()) {
                $lines = explode("\n", $response->body());
                foreach ($lines as $line) {
                    [$hashSuffix, $count] = explode(':', trim($line));
                    if ($hashSuffix === $suffix && (int)$count > 5) {
                        $fail('This password has appeared in a data breach. Please choose a different password.');
                        return;
                    }
                }
            }
        } catch (\Exception $e) {
            // Fail open on timeout to not block users, but log it
            \Illuminate\Support\Facades\Log::warning('HIBP check failed: ' . $e->getMessage());
        }
    }
}
