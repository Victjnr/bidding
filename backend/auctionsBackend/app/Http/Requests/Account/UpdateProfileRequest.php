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

    public function rules(): array
    {
        $userId = $this->user()->id;

        return [
            'display_name' => [
                'nullable', 'string', 'min:3', 'max:50',
                "unique:users,display_name,{$userId}",
                'regex:/^[a-zA-Z0-9._-]+$/',
            ],
            'bio' => 'nullable|string|max:500',
            'phone' => ['nullable', new \App\Rules\PhoneRule],
        ];
    }
}
