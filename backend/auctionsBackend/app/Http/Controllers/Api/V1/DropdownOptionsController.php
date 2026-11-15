<?php

namespace App\Http\Controllers\Api\V1;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;

class DropdownOptionsController extends Controller
{
    /**
     * GET /api/v1/settings/dropdown-options
     *
     * Returns all admin-managed dropdown options for the auction wizard.
     * Public endpoint — no auth required.
     */
    public function index(): JsonResponse
    {
        $keys = [
            'auction.conditions',
            'auction.currencies',
            'auction.types',
        ];

        $settings = PlatformSetting::whereIn('key', $keys)->get()->keyBy('key');

        $categories = Category::orderBy('sort_order')->get(['id', 'slug', 'name', 'icon', 'description']);

        $defaultConditions = [
            ['value' => 'new', 'label' => 'Brand New'],
            ['value' => 'like_new', 'label' => 'Like New'],
            ['value' => 'good', 'label' => 'Good'],
            ['value' => 'fair', 'label' => 'Fair'],
            ['value' => 'for_parts', 'label' => 'For Parts / Not Working'],
        ];

        $defaultCurrencies = [
            ['value' => 'USD', 'label' => 'US Dollar ($)', 'symbol' => '$'],
            ['value' => 'ZWL', 'label' => 'Zimbabwe Gold (ZiG)', 'symbol' => 'ZiG'],
            ['value' => 'ZAR', 'label' => 'South African Rand (R)', 'symbol' => 'R'],
        ];

        $defaultTypes = [
            ['value' => 'standard', 'label' => 'Standard English Auction', 'description' => 'Highest bidder wins when timer expires'],
            ['value' => 'reserve', 'label' => 'Reserve Price Auction', 'description' => 'Only sells if bidding reaches your hidden minimum price'],
            ['value' => 'buy_now', 'label' => 'Auction + Buy It Now', 'description' => 'Bidders can bid or purchase immediately at a fixed price'],
        ];

        $defaultDurations = [
            ['value' => 1, 'label' => '1 Day'],
            ['value' => 3, 'label' => '3 Days'],
            ['value' => 5, 'label' => '5 Days'],
            ['value' => 7, 'label' => '7 Days'],
            ['value' => 14, 'label' => '14 Days'],
        ];

        $defaultCountries = [
            ['value' => 'ZW', 'label' => 'Zimbabwe'],
            ['value' => 'ZA', 'label' => 'South Africa'],
            ['value' => 'BW', 'label' => 'Botswana'],
            ['value' => 'ZM', 'label' => 'Zambia'],
        ];

        return ApiResponse::success([
            'conditions'   => $settings->get('auction.conditions')?->value ?: $defaultConditions,
            'currencies'   => $settings->get('auction.currencies')?->value ?: $defaultCurrencies,
            'auctionTypes' => $settings->get('auction.types')?->value ?: $defaultTypes,
            'durations'    => $defaultDurations,
            'countries'    => $defaultCountries,
            'categories'   => $categories,
        ], 'Dropdown options retrieved');
    }
}
