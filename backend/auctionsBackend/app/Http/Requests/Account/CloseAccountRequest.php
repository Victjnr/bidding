<?php

namespace App\Http\Requests\Account;

use App\Rules\VerifyCurrentPasswordRule;
use Illuminate\Foundation\Http\FormRequest;

class CloseAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'confirmation_text' => 'required|in:DELETE',
            'password' => ['required', new VerifyCurrentPasswordRule],
        ];
    }
}
