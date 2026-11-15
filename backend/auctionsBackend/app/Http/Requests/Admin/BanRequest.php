<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reason' => $this->input('reason') ?: 'Banned by administrator',
        ]);
    }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|max:255',
        ];
    }
}
