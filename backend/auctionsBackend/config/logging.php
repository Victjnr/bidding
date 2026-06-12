<?php

return [
    'default' => env('LOG_CHANNEL', 'stack'),
    'channels' => [
        'stack' => [
            'driver' => 'stack',
            'channels' => ['single'],
            'ignore_exceptions' => false,
        ],
        'single' => [
            'driver' => 'single',
            'path' => storage_path('logs/laravel.log'),
            'level' => env('LOG_LEVEL', 'debug'),
        ],
        'security' => [
            'driver' => 'daily',
            'path' => storage_path('logs/security.log'),
            'formatter' => \Monolog\Formatter\JsonFormatter::class,
            'days' => 90,
            'level' => 'info',
        ],
    ],
];
