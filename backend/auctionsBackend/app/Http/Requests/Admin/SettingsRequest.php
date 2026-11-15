<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'key' => 'nullable|string|max:255',
            'value' => 'nullable',
            'settings' => 'nullable|array',
        ];
    }
}
