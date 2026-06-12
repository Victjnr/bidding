<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CommissionTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'seller_tier',
        'percentage',
        'fixed_fee',
        'min_fee',
        'max_fee',
        'effective_from',
        'effective_to',
    ];

    protected $casts = [
        'percentage' => 'decimal:4',
        'fixed_fee' => 'decimal:2',
        'min_fee' => 'decimal:2',
        'max_fee' => 'decimal:2',
        'effective_from' => 'datetime',
        'effective_to' => 'datetime',
    ];
}
