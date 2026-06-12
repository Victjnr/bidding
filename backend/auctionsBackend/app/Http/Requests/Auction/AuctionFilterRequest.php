<?php

namespace App\Http\Requests\Auction;

use Illuminate\Foundation\Http\FormRequest;

class AuctionFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'filter' => 'nullable|array',
            'sort' => 'nullable|string',
            'include' => 'nullable|string',
        ];
    }
}
