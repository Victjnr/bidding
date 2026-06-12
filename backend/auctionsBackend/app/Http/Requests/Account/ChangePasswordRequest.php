<?php

namespace App\Http\Requests\Account;

use App\Rules\PasswordComplexityRule;
use App\Rules\VerifyCurrentPasswordRule;
use Illuminate\Foundation\Http\FormRequest;

class ChangePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', new VerifyCurrentPasswordRule],
            'new_password' => [
                'required', 'min:12', 'confirmed', 'different:current_password',
                new PasswordComplexityRule,
            ],
        ];
    }
}
