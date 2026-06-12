<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class MimeMagicRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!$value instanceof UploadedFile || !$value->isValid()) {
            $fail('The :attribute must be a valid file.');
            return;
        }

        $path = $value->getRealPath();
        $file = fopen($path, 'rb');
        if (!$file) {
            $fail("Unable to read file for magic bytes validation.");
            return;
        }

        $bytes = bin2hex(fread($file, 8));
        fclose($file);
        $bytes = strtoupper($bytes);

        $ext = strtolower($value->getClientOriginalExtension());
        $valid = false;

        if (in_array($ext, ['jpg', 'jpeg']) && str_starts_with($bytes, 'FFD8FF')) {
            $valid = true;
        } elseif ($ext === 'png' && str_starts_with($bytes, '89504E47')) {
            $valid = true;
        } elseif ($ext === 'pdf' && str_starts_with($bytes, '25504446')) {
            $valid = true;
        } elseif ($ext === 'webp' && str_starts_with(substr($bytes, 16), '57454250')) { // RIFF ... WEBP
            $valid = true;
        }

        if (!$valid) {
            $fail('The file signature (magic bytes) does not match the extension.');
        }
    }
}
