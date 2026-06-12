<?php

namespace App\Http\Requests\Seller;

use Illuminate\Foundation\Http\FormRequest;

class ListingFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|string',
            'sort' => 'sometimes|string',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ];
    }
}
