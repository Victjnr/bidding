<?php

namespace App\Jobs\Auction;

use App\Models\AuctionMedia;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessImageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public AuctionMedia $media)
    {}

    public function handle(): void
    {
        // Process images, generate thumbnails, upload to public disk
    }
}
