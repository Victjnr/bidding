<?php

namespace App\Rules;

use App\Models\Auction;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Redis;

class BidMeetsMinimumRule implements ValidationRule
{
    public function __construct(
        protected Auction $auction
    ) {}

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $amount = (float) $value;
        
        // Use Redis to get the most up-to-date price avoiding DB locks
        $redisKey = "auction:{$this->auction->id}:current_price";
        $currentPrice = Redis::get($redisKey);

        if ($currentPrice === null) {
            $currentPrice = $this->auction->current_price;
            Redis::setex($redisKey, 3600, $currentPrice);
        }

        $minBid = (float) $currentPrice + (float) $this->auction->increment_amount;

        if ($amount < $minBid) {
            $fail("The bid amount must be at least {$minBid}.");
        }
    }
}
