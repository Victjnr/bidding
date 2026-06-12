<?php

namespace App\Http\Requests\Bid;

use App\Enums\BidType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class PlaceBidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'type' => ['sometimes', new Enum(BidType::class)],
            'device_fingerprint' => 'nullable|string|max:255',
        ];
    }
}
