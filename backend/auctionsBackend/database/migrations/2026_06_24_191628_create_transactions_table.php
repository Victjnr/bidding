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
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('auction_id')->constrained('auctions')->onDelete('cascade');
            $table->foreignId('buyer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('seller_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('type');
            $table->string('status');
            $table->decimal('gross_amount', 15, 2);
            $table->decimal('net_amount', 15, 2);
            $table->decimal('fee_amount', 15, 2);
            $table->string('currency', 3)->default('USD');
            $table->string('provider_transaction_id')->nullable();
            $table->timestamp('escrow_released_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
