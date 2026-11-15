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
        Schema::create('auctions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('seller_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('categories')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->string('auction_type')->default('english');
            $table->string('status')->default('draft');
            $table->string('condition')->nullable();
            $table->string('location_country')->nullable();
            $table->string('location_city')->nullable();
            $table->string('currency_code', 3)->default('USD');
            $table->decimal('start_price', 15, 2)->default(0);
            $table->decimal('reserve_price', 15, 2)->nullable();
            $table->decimal('current_price', 15, 2)->default(0);
            $table->decimal('bin_price', 15, 2)->nullable();
            $table->string('bid_increment_type')->default('dynamic');
            $table->decimal('bid_increment_value', 15, 2)->nullable();
            $table->boolean('deposit_required')->default(false);
            $table->decimal('deposit_amount', 15, 2)->nullable();
            $table->timestamp('start_at')->nullable();
            $table->timestamp('end_at')->nullable();
            $table->integer('anti_snipe_minutes')->nullable();
            $table->integer('anti_snipe_extend_minutes')->nullable();
            $table->integer('max_extension_minutes')->nullable();
            $table->integer('total_bids')->default(0);
            $table->foreignId('winning_bid_id')->nullable(); // Can't constrain yet, bids table doesn't exist. Will add later or leave unconstrained.
            $table->foreignId('winner_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auctions');
    }
};
