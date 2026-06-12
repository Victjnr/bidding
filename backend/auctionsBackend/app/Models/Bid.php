<?php

namespace App\Models;

use App\Enums\BidType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Bid extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'auction_id',
        'bidder_id',
        'amount',
        'type',
        'ip_address',
        'device_fingerprint',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'type' => BidType::class,
    ];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function auction(): BelongsTo
    {
        return $this->belongsTo(Auction::class);
    }

    public function bidder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'bidder_id');
    }
}
