<?php

namespace App\Http\Requests\Bid;

use Illuminate\Foundation\Http\FormRequest;

class SetProxyBidRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'max_amount' => 'required|numeric|min:0.01',
        ];
    }
}
