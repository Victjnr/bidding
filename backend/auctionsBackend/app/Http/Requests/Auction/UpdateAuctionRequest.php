<?php

namespace App\Http\Requests\Auction;

use App\Enums\AuctionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateAuctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'auction_type' => ['sometimes', new Enum(AuctionType::class)],
            'category_id' => 'sometimes|integer',
            'condition' => 'sometimes|string|max:50',
            'location_country' => 'sometimes|string|size:2',
            'location_city' => 'sometimes|string|max:100',
            'currency_code' => 'sometimes|string|size:3',
            'start_price' => 'sometimes|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'bin_price' => 'nullable|numeric|min:0',
            'bid_increment_type' => 'sometimes|string|in:static,percentage,dynamic',
            'bid_increment_value' => 'sometimes|numeric|min:0',
            'deposit_required' => 'sometimes|boolean',
            'deposit_amount' => 'nullable|numeric|min:0',
            'start_at' => 'sometimes|date|after_or_equal:now',
            'end_at' => 'sometimes|date|after:start_at',
            'anti_snipe_minutes' => 'sometimes|integer|min:0',
            'anti_snipe_extend_minutes' => 'sometimes|integer|min:0',
            'max_extension_minutes' => 'sometimes|integer|min:0',
        ];
    }
}
