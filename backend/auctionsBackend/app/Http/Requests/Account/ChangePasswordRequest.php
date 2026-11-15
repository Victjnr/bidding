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

    protected function prepareForValidation(): void
    {
        $this->merge([
            'currentPassword' => $this->input('currentPassword') ?? $this->input('current_password'),
            'newPassword' => $this->input('newPassword') ?? $this->input('new_password') ?? $this->input('password'),
        ]);
    }

    public function rules(): array
    {
        return [
            'currentPassword' => ['required', new VerifyCurrentPasswordRule],
            'newPassword' => [
                'required', 'min:8', 'different:currentPassword',
            ],
        ];
    }
}
