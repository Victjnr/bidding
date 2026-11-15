<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('watchlist', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('auction_id')->constrained('auctions')->onDelete('cascade');
            $table->boolean('notify_outbid')->default(true);
            $table->boolean('notify_ending_soon')->default(true);
            $table->boolean('notify_price_drop')->default(true);
            $table->timestamps();
            
            $table->unique(['user_id', 'auction_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('watchlist');
    }
};
