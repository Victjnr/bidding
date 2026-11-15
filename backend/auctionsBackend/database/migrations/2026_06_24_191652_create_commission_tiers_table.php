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
        Schema::create('commission_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained('categories')->onDelete('set null');
            $table->string('seller_tier')->nullable();
            $table->decimal('percentage', 8, 4)->default(0);
            $table->decimal('fixed_fee', 15, 2)->default(0);
            $table->decimal('min_fee', 15, 2)->default(0);
            $table->decimal('max_fee', 15, 2)->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamp('effective_to')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_tiers');
    }
};
