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
        Schema::table('users', function (Blueprint $table) {
            $table->string('kyc_tier')->default('tier_0')->after('status');
            $table->text('two_factor_secret')->nullable()->after('kyc_tier');
            $table->boolean('two_factor_enabled')->default(false)->after('two_factor_secret');
            $table->integer('failed_login_attempts')->default(0)->after('two_factor_enabled');
            $table->integer('trust_score')->default(100)->after('failed_login_attempts');
            $table->timestamp('member_since')->nullable()->after('trust_score');
            $table->text('bio')->nullable()->after('member_since');
            $table->string('avatar_path')->nullable()->after('bio');
            $table->boolean('is_anonymous')->default(false)->after('avatar_path');
            $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            $table->json('notification_preferences')->nullable()->after('is_anonymous');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'kyc_tier', 'two_factor_secret', 'two_factor_enabled', 'failed_login_attempts', 
                'trust_score', 'member_since', 'bio', 'avatar_path', 'is_anonymous',
                'phone_verified_at', 'notification_preferences'
            ]);
        });
    }
};
