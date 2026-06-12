<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AuditFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'action' => 'sometimes|string',
            'actor_id' => 'sometimes|integer|exists:users,id',
            'subject_type' => 'sometimes|string',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
            'per_page' => 'sometimes|integer|min:1|max:100',
        ];
    }
}
