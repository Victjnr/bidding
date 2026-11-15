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

    protected function prepareForValidation(): void
    {
        if (!$this->has('type') && $this->has('document_type')) {
            $this->merge([
                'type' => $this->input('document_type'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:id_card,national_id,passport,drivers_license,utility_bill,proof_of_address,selfie',
            'file' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,pdf,webp',
                'max:10240',
            ],
        ];
    }
}
