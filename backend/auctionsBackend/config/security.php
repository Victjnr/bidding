<?php

return [
    'bcrypt_cost' => env('BCRYPT_COST', 12),
    'token_ttl' => env('TOKEN_TTL_MINUTES', 15),
    'refresh_token_ttl' => env('REFRESH_TOKEN_TTL_DAYS', 7),
    'lockout' => [
        'max_attempts' => 5,
        'decay_minutes' => 15,
    ],
];
