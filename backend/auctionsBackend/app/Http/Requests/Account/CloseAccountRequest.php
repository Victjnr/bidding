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

    protected function prepareForValidation(): void
    {
        if (!$this->has('confirmation_text') && $this->has('confirmation')) {
            $this->merge([
                'confirmation_text' => $this->input('confirmation'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'confirmation_text' => 'required|in:DELETE',
            'password' => ['required', new VerifyCurrentPasswordRule],
        ];
    }
}
