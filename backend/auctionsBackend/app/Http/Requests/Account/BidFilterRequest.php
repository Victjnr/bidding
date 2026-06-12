<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;

class BidFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'sometimes|string|in:winning,outbid,all',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ];
    }
}
