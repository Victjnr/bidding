<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'type' => $this->input('type') ?? 'shipping',
            'line1' => $this->input('line1') ?? $this->input('address_line_1') ?? $this->input('addressLine1'),
            'line2' => $this->input('line2') ?? $this->input('address_line_2') ?? $this->input('addressLine2'),
            'postalCode' => $this->input('postalCode') ?? $this->input('postal_code'),
            'isDefault' => $this->boolean('isDefault', $this->boolean('is_primary', false)),
        ]);
    }

    public function rules(): array
    {
        return [
            'type' => 'required|string|in:shipping,billing',
            'line1' => 'required|string|max:255',
            'line2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postalCode' => 'required|string|max:20',
            'country' => 'required|string|max:100',
            'isDefault' => 'sometimes|boolean',
        ];
    }
}
