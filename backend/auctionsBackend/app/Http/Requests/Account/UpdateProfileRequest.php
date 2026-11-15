<?php

namespace App\Http\Requests\Account;

use App\Rules\VerifyCurrentPasswordRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $phone = $this->phone;
        if (is_string($phone) && (trim($phone) === '' || $phone === 'null' || $phone === 'undefined')) {
            $phone = null;
        }
        
        $this->merge([
            'firstName' => $this->input('firstName') ?? $this->input('first_name'),
            'lastName' => $this->input('lastName') ?? $this->input('last_name'),
            'displayName' => $this->input('displayName') ?? $this->input('display_name'),
            'phone' => $phone,
        ]);
    }

    protected function failedValidation(\Illuminate\Contracts\Validation\Validator $validator)
    {
        \Illuminate\Support\Facades\Log::error('Profile validation failed: ', $validator->errors()->toArray());
        parent::failedValidation($validator);
    }

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'firstName' => 'nullable|string|max:50',
            'lastName' => 'nullable|string|max:50',
            'displayName' => [
                'nullable', 'string', 'min:3', 'max:50',
                "unique:users,display_name,{$userId}",
                'regex:/^[a-zA-Z0-9._-]+$/',
            ],
            'bio' => 'nullable|string|max:500',
            'phone' => ['nullable', new \App\Rules\PhoneRule],
        ];
    }
}
