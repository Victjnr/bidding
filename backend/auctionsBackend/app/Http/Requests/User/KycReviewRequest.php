<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class KycReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => 'required|in:approved,rejected',
            'rejection_reason' => 'required_if:status,rejected|string|max:500'
        ];
    }
}
