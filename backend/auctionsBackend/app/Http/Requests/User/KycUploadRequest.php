<?php

namespace App\Http\Requests\User;

use App\Rules\MimeMagicRule;
use Illuminate\Foundation\Http\FormRequest;

class KycUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:national_id,passport,drivers_license,utility_bill,selfie',
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf',
                'max:5120',
                new MimeMagicRule()
            ],
        ];
    }
}
