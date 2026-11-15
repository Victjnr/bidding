<?php

namespace App\Http\Requests\Auth;

use App\Rules\PhoneRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'first_name' => $this->input('first_name') ?? $this->input('firstName'),
            'last_name' => $this->input('last_name') ?? $this->input('lastName'),
            'password_confirmation' => $this->input('password_confirmation') ?? $this->input('passwordConfirmation'),
            'terms_accepted' => $this->input('terms_accepted') ?? $this->input('termsAccepted') ?? true,
        ]);
    }

    public function rules(): array
    {
        return [
            'email' => 'required|email|max:180|unique:users,email',
            'password' => [
                'required',
                'min:8',
                'confirmed',
                new \App\Rules\PasswordComplexityRule()
            ],
            'first_name' => ['required', 'string', 'max:80', 'regex:/^[a-zA-Z\s\-]+$/'],
            'last_name' => ['required', 'string', 'max:80', 'regex:/^[a-zA-Z\s\-]+$/'],
            'phone' => ['nullable', new PhoneRule()],
            'terms_accepted' => 'required|accepted',
        ];
    }
}
