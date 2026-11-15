<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class TwoFactorVerifyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->input('user_id') && $this->input('email')) {
            $user = \App\Models\User::where('email', $this->input('email'))->first();
            if ($user) {
                $this->merge(['user_id' => $user->uuid]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'user_id' => 'required|string',
            'code' => 'required|string|size:6',
            'email' => 'nullable|email',
        ];
    }
}
