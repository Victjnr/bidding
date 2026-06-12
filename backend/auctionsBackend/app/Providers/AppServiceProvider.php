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
        \Illuminate\Support\Facades\RateLimiter::for('api', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('auth', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(10)->by($request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('bids', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(30)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('search', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(60)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('uploads', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(20)->by($request->user()?->id ?: $request->ip()));
        \Illuminate\Support\Facades\RateLimiter::for('otp', fn (\Illuminate\Http\Request $request) => \Illuminate\Cache\RateLimiting\Limit::perMinute(5)->by($request->ip()));
    }
}
