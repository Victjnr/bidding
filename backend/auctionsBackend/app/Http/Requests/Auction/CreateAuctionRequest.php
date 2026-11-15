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

    protected function prepareForValidation(): void
    {
        $locationCity = $this->input('location_city') ?? $this->input('locationCity');
        $locationCountry = $this->input('location_country') ?? $this->input('locationCountry');

        if ((!$locationCity || !$locationCountry) && $this->filled('location')) {
            $parts = array_map('trim', explode(',', (string) $this->input('location')));
            $locationCity = $locationCity ?: ($parts[0] ?: 'Harare');
            $rawCountry = $parts[1] ?? 'ZW';
            $locationCountry = $locationCountry ?: (strlen($rawCountry) === 2 ? strtoupper($rawCountry) : 'ZW');
        }

        $autoExtend = $this->boolean('autoExtend', true);
        $autoExtendMinutes = $this->input('autoExtendMinutes', 5);
        $extensionWindowMinutes = $this->input('extensionWindowMinutes', 5);

        $rawCategory = $this->input('category_id') ?? $this->input('categoryId') ?? $this->input('category');
        if ($rawCategory && !is_numeric($rawCategory)) {
            $catModel = \App\Models\Category::where('slug', $rawCategory)->orWhere('name', $rawCategory)->first();
            $rawCategory = $catModel?->id;
        }
        if (!$rawCategory) {
            $rawCategory = \App\Models\Category::value('id');
        }

        $auctionType = $this->input('auction_type') ?? $this->input('auctionType') ?? 'standard';
        $binPrice = $this->input('bin_price') ?? $this->input('buyNowPrice');
        $startPrice = $this->input('start_price') ?? $this->input('startPrice');
        if (($startPrice === null || $startPrice === '' || (float) $startPrice <= 0) && $binPrice) {
            $startPrice = $binPrice;
        }

        $bidIncrementValue = $this->input('bid_increment_value') ?? $this->input('minBidIncrement');
        if ($bidIncrementValue === null || $bidIncrementValue === '' || (float) $bidIncrementValue <= 0) {
            $bidIncrementValue = 1;
        }

        $this->merge([
            'description' => $this->input('description') ?: ($this->input('title') ?: 'Auction item'),
            'auction_type' => $auctionType,
            'category_id' => $rawCategory ? (int) $rawCategory : null,
            'location_country' => $locationCountry ?: 'ZW',
            'location_city' => $locationCity ?: 'Harare',
            'currency_code' => strtoupper($this->input('currency_code') ?? $this->input('currency') ?? 'USD'),
            'start_price' => (float) ($startPrice ?? 0),
            'reserve_price' => $this->input('reserve_price') ?? $this->input('reservePrice'),
            'bin_price' => $binPrice,
            'bid_increment_type' => $this->input('bid_increment_type') ?? $this->input('bidIncrementType') ?? 'static',
            'bid_increment_value' => (float) $bidIncrementValue,
            'deposit_required' => $this->boolean('deposit_required', $this->boolean('depositRequired', false)),
            'deposit_amount' => $this->input('deposit_amount') ?? $this->input('depositAmount'),
            'start_at' => $this->input('start_at') ?: $this->input('startAt') ?: now()->toIso8601String(),
            'end_at' => $this->input('end_at') ?: $this->input('endAt') ?: now()->addDays(7)->toIso8601String(),
            'anti_snipe_minutes' => (int) ($this->input('anti_snipe_minutes') ?? ($autoExtend ? (int) $extensionWindowMinutes : 0)),
            'anti_snipe_extend_minutes' => (int) ($this->input('anti_snipe_extend_minutes') ?? ($autoExtend ? (int) $autoExtendMinutes : 0)),
            'max_extension_minutes' => (int) ($this->input('max_extension_minutes') ?? ($autoExtend ? 60 : 0)),
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'auction_type' => ['required', new Enum(AuctionType::class)],
            'category_id' => 'required|integer|exists:categories,id',
            'condition' => 'required|string|max:50',
            'location_country' => 'required|string|max:50',
            'location_city' => 'required|string|max:100',
            'currency_code' => 'required|string|max:10',
            'start_price' => 'required|numeric|min:0',
            'reserve_price' => 'nullable|numeric|min:0',
            'bin_price' => 'nullable|numeric|min:0',
            'bid_increment_type' => 'required|string|in:static,percentage,dynamic',
            'bid_increment_value' => 'required|numeric|min:0',
            'deposit_required' => 'required|boolean',
            'deposit_amount' => 'nullable|numeric|min:0',
            'start_at' => 'required|date',
            'end_at' => 'required|date|after:start_at',
            'anti_snipe_minutes' => 'required|integer|min:0',
            'anti_snipe_extend_minutes' => 'required|integer|min:0',
            'max_extension_minutes' => 'required|integer|min:0',
        ];
    }
}
