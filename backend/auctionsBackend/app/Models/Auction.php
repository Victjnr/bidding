<?php

namespace App\Models;

use App\Enums\AuctionStatus;
use App\Enums\AuctionType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Auction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'uuid',
        'seller_id',
        'category_id',
        'title',
        'description',
        'auction_type',
        'status',
        'condition',
        'location_country',
        'location_city',
        'currency_code',
        'start_price',
        'reserve_price',
        'current_price',
        'bin_price',
        'bid_increment_type',
        'bid_increment_value',
        'deposit_required',
        'deposit_amount',
        'start_at',
        'end_at',
        'anti_snipe_minutes',
        'anti_snipe_extend_minutes',
        'max_extension_minutes',
        'total_bids',
        'winning_bid_id',
        'winner_id',
    ];

    protected $casts = [
        'auction_type' => AuctionType::class,
        'status' => AuctionStatus::class,
        'start_price' => 'decimal:2',
        'reserve_price' => 'decimal:2',
        'current_price' => 'decimal:2',
        'bin_price' => 'decimal:2',
        'deposit_required' => 'boolean',
        'deposit_amount' => 'decimal:2',
        'start_at' => 'datetime',
        'end_at' => 'datetime',
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

    public function getRouteKeyName()
    {
        return 'uuid';
    }

    public function resolveRouteBinding($value, $field = null)
    {
        if ($field) {
            return $this->where($field, $value)->firstOrFail();
        }
        return $this->where('uuid', $value)
            ->when(is_numeric($value), fn($q) => $q->orWhere('id', (int) $value))
            ->firstOrFail();
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function winner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'winner_id');
    }

    public function winningBid(): BelongsTo
    {
        return $this->belongsTo(Bid::class, 'winning_bid_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(AuctionMedia::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function proxyBids(): HasMany
    {
        return $this->hasMany(ProxyBid::class);
    }

    public function watchers()
    {
        return $this->belongsToMany(User::class, 'watchlist')
            ->withPivot(['notify_outbid', 'notify_ending_soon', 'notify_price_drop'])
            ->withTimestamps();
    }
}
