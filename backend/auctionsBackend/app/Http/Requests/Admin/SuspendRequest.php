<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SuspendRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'days' => $this->input('days') ?? $this->input('durationDays') ?? 7,
            'reason' => $this->input('reason') ?: 'Suspended by administrator',
        ]);
    }

    public function rules(): array
    {
        return [
            'reason' => 'nullable|string|max:255',
            'days' => 'nullable|integer|min:1|max:365',
        ];
    }
}
