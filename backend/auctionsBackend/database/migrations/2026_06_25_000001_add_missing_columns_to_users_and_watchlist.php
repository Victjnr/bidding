<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'is_anonymous')) {
                    $table->boolean('is_anonymous')->default(false);
                }
                if (!Schema::hasColumn('users', 'phone_verified_at')) {
                    $table->timestamp('phone_verified_at')->nullable();
                }
                if (!Schema::hasColumn('users', 'notification_preferences')) {
                    $table->json('notification_preferences')->nullable();
                }
            });
        }

        if (Schema::hasTable('watchlist')) {
            Schema::table('watchlist', function (Blueprint $table) {
                if (!Schema::hasColumn('watchlist', 'notify_outbid')) {
                    $table->boolean('notify_outbid')->default(true);
                }
                if (!Schema::hasColumn('watchlist', 'notify_ending_soon')) {
                    $table->boolean('notify_ending_soon')->default(true);
                }
                if (!Schema::hasColumn('watchlist', 'notify_price_drop')) {
                    $table->boolean('notify_price_drop')->default(true);
                }
            });
        }
    }

    public function down(): void
    {
        // Safe no-op on down since base migrations drop these columns/tables
    }
};
