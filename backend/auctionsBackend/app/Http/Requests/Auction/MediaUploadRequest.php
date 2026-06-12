<?php

namespace App\Http\Requests\Auction;

use Illuminate\Foundation\Http\FormRequest;

class MediaUploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'files' => 'required|array|max:21', // 20 images + 1 video max
            'files.*' => 'required|file|max:50000', // 50MB limit per file
            'is_primary' => 'boolean',
        ];
    }
}
