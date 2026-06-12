<?php

namespace App\Http\Requests\Auction;

use App\Enums\AuctionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class CreateAuctionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'auction_type' => ['required', new Enum(AuctionType::class)],
            'category_id' => 'required|integer|exists:categories,id',
            'condition' => 'required|string|max:50',
            'location_country' => 'required|string|size:2',
            'location_city' => 'required|string|max:100',
            'currency_code' => 'required|string|size:3',
            'start_price' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'bin_price' => 'nullable|numeric|min:0',
            'bid_increment_type' => 'required|string|in:static,percentage,dynamic',
            'bid_increment_value' => 'required|numeric|min:0',
            'deposit_required' => 'required|boolean',
            'deposit_amount' => 'nullable|numeric|min:0',
            'start_at' => 'required|date|after_or_equal:now',
            'end_at' => 'required|date|after:start_at',
            'anti_snipe_minutes' => 'required|integer|min:0',
            'anti_snipe_extend_minutes' => 'required|integer|min:0',
            'max_extension_minutes' => 'required|integer|min:0',
        ];
    }
}
