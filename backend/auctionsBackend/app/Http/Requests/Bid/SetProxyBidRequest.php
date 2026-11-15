<?php

namespace App\Http\Requests\Bid;

use Illuminate\Foundation\Http\FormRequest;

class SetProxyBidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('max_amount') && $this->has('maxAmount')) {
            $this->merge([
                'max_amount' => $this->input('maxAmount'),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'max_amount' => 'required|numeric|min:0.01',
        ];
    }
}
