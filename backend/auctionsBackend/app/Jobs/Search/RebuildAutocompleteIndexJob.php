<?php

namespace App\Jobs\Search;

use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Redis;

class RebuildAutocompleteIndexJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(): void
    {
        $key = 'search:autocomplete';
        
        // Create a temporary key
        $tempKey = $key . ':temp';
        Redis::del($tempKey);

        // Fetch active auction titles
        // In reality, this could be millions of records, so we'd chunk it.
        Auction::select('title')->where('status', 'active')->chunk(1000, function ($auctions) use ($tempKey) {
            foreach ($auctions as $auction) {
                // Generate tokens (e.g., words >= 3 chars)
                $title = strtolower(trim($auction->title));
                
                // Add the full title
                Redis::zAdd($tempKey, 0, $title);

                // Add individual words
                $words = explode(' ', $title);
                foreach ($words as $word) {
                    if (strlen($word) >= 3) {
                        Redis::zAdd($tempKey, 0, $word);
                    }
                }
            }
        });

        // Swap the temp key with the main key atomically via rename
        Redis::rename($tempKey, $key);
    }
}
