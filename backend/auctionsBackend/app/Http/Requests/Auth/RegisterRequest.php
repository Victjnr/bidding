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

    public function rules(): array
    {
        return [
            'email' => 'required|email:rfc,dns|max:180|unique:users,email',
            'password' => [
                'required',
                'min:12',
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
