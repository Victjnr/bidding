<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $syncMarker = storage_path('app/.schema_v3_synced');
        if (!file_exists($syncMarker) && !$this->app->runningInConsole()) {
            try {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
                \Illuminate\Support\Facades\Artisan::call('db:seed', ['--force' => true]);
                if (!file_exists(public_path('storage'))) {
                    \Illuminate\Support\Facades\Artisan::call('storage:link');
                }
                if (!is_dir(dirname($syncMarker))) {
                    @mkdir(dirname($syncMarker), 0755, true);
                }
                @file_put_contents($syncMarker, now()->toIso8601String());
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('Auto schema sync skipped: ' . $e->getMessage());
            }
        }

        \Illuminate\Support\Facades\Broadcast::routes(['prefix' => 'api/v1', 'middleware' => ['api', 'auth:sanctum']]);
        \Illuminate\Support\Facades\Broadcast::routes(['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']]);

        \Illuminate\Support\Facades\RateLimiter::for('api', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('auth', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('bids', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('search', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('uploads', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('otp', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip()));
    }
}
