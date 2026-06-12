<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeatureFlag extends Model
{
    protected $fillable = [
        'name',
        'is_enabled',
        'rollout_percentage',
        'allowlist', // JSON array of user IDs
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'rollout_percentage' => 'integer',
        'allowlist' => 'array',
    ];
}
