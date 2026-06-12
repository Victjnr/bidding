<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(\App\Http\Middleware\SanitiseInputMiddleware::class);
        $middleware->alias([
            'security.headers' => \App\Http\Middleware\SecurityHeadersMiddleware::class,
            'force.https' => \App\Http\Middleware\ForceHttpsMiddleware::class,
            'security.log' => \App\Http\Middleware\LogSecurityEvents::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
