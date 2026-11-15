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

    protected function prepareForValidation(): void
    {
        $merged = [];
        if ($this->has('auctionType')) $merged['auction_type'] = $this->input('auctionType');
        if ($this->has('categoryId')) $merged['category_id'] = $this->input('categoryId');
        if ($this->has('startPrice')) $merged['start_price'] = $this->input('startPrice');
        if ($this->has('reservePrice')) $merged['reserve_price'] = $this->input('reservePrice');
        if ($this->has('buyNowPrice')) $merged['bin_price'] = $this->input('buyNowPrice');
        if ($this->has('minBidIncrement')) $merged['bid_increment_value'] = $this->input('minBidIncrement');
        if ($this->has('currency')) $merged['currency_code'] = $this->input('currency');
        if ($this->has('startAt')) $merged['start_at'] = $this->input('startAt');
        if ($this->has('endAt')) $merged['end_at'] = $this->input('endAt');
        if ($this->has('location')) {
            $parts = array_map('trim', explode(',', (string) $this->input('location')));
            $merged['location_city'] = $parts[0] ?: 'Harare';
            $rawCountry = $parts[1] ?? 'ZW';
            $merged['location_country'] = strlen($rawCountry) === 2 ? strtoupper($rawCountry) : 'ZW';
        }
        if (!empty($merged)) {
            $this->merge($merged);
        }
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'auction_type' => ['sometimes', new Enum(AuctionType::class)],
            'category_id' => 'sometimes|integer',
            'condition' => 'sometimes|string|max:50',
            'location_country' => 'sometimes|string|max:50',
            'location_city' => 'sometimes|string|max:100',
            'currency_code' => 'sometimes|string|max:10',
            'start_price' => 'sometimes|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'bin_price' => 'nullable|numeric|min:0',
            'bid_increment_type' => 'sometimes|string|in:static,percentage,dynamic',
            'bid_increment_value' => 'sometimes|numeric|min:0',
            'deposit_required' => 'sometimes|boolean',
            'deposit_amount' => 'nullable|numeric|min:0',
            'start_at' => 'sometimes|date',
            'end_at' => 'sometimes|date|after:start_at',
            'anti_snipe_minutes' => 'sometimes|integer|min:0',
            'anti_snipe_extend_minutes' => 'sometimes|integer|min:0',
            'max_extension_minutes' => 'sometimes|integer|min:0',
        ];
    }
}
