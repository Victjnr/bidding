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
            'files' => 'nullable|array|max:21', // 20 images + 1 video max
            'files.*' => 'file|max:50000', // 50MB limit per file
            'media' => 'nullable|array|max:21',
            'media.*' => 'file|max:50000',
            'file' => 'nullable|file|max:50000',
            'is_primary' => 'boolean',
        ];
    }
}
