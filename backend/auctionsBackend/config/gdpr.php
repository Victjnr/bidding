<?php

return [
    /*
    |--------------------------------------------------------------------------
    | GDPR Data Retention
    |--------------------------------------------------------------------------
    |
    | Number of days after account closure before hard-deleting user data.
    | Default: 730 days (2 years).
    |
    */
    'retention_days' => env('GDPR_RETENTION_DAYS', 730),
];
