<?php

namespace Database\Seeders;

use App\Models\PlatformSetting;
use Illuminate\Database\Seeder;

class DropdownOptionsSeeder extends Seeder
{
    public function run(): void
    {
        $options = [
            'auction.conditions' => [
                ['value' => 'new', 'label' => 'New'],
                ['value' => 'used_like_new', 'label' => 'Used — Like New'],
                ['value' => 'used_good', 'label' => 'Used — Good'],
                ['value' => 'used_fair', 'label' => 'Used — Fair'],
                ['value' => 'refurbished', 'label' => 'Refurbished'],
                ['value' => 'parts_only', 'label' => 'For Parts Only'],
            ],
            'auction.currencies' => [
                ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$'],
                ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€'],
                ['code' => 'GBP', 'name' => 'British Pound', 'symbol' => '£'],
                ['code' => 'ZAR', 'name' => 'South African Rand', 'symbol' => 'R'],
                ['code' => 'ZWL', 'name' => 'Zimbabwe Dollar', 'symbol' => 'ZWL$'],
                ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$'],
                ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'C$'],
            ],
            'auction.types' => [
                [
                    'value' => 'forward',
                    'label' => 'Forward (English)',
                    'description' => 'Classic ascending-price auction. The highest bidder wins when time expires.',
                    'icon' => 'ArrowUpRight',
                ],
                [
                    'value' => 'reverse',
                    'label' => 'Reverse (Dutch)',
                    'description' => 'Price starts high and drops over time. First bidder to accept the price wins.',
                    'icon' => 'ArrowDownRight',
                ],
                [
                    'value' => 'sealed',
                    'label' => 'Sealed Bid',
                    'description' => 'All bids are hidden. The highest bidder is revealed only when the auction closes.',
                    'icon' => 'Lock',
                ],
                [
                    'value' => 'penny',
                    'label' => 'Penny Auction',
                    'description' => 'Each bid raises the price by a small increment. Every bid costs a token.',
                    'icon' => 'Coins',
                ],
                [
                    'value' => 'bin',
                    'label' => 'Buy It Now',
                    'description' => 'Fixed-price listing. The first buyer to pay the listed price wins immediately.',
                    'icon' => 'ShoppingCart',
                ],
                [
                    'value' => 'live',
                    'label' => 'Live Auction',
                    'description' => 'Real-time auctioneer-led session with live bidding via video and chat.',
                    'icon' => 'Radio',
                ],
            ],
        ];

        foreach ($options as $key => $value) {
            PlatformSetting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }
    }
}
