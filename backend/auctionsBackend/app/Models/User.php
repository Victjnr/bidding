<?php

namespace App\Models;

use App\Enums\UserStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Str;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'uuid',
        'first_name',
        'last_name',
        'display_name',
        'email',
        'password',
        'phone',
        'phone_verified_at',
        'email_verified_at',
        'status',
        'kyc_tier',
        'two_factor_secret',
        'two_factor_enabled',
        'failed_login_attempts',
        'trust_score',
        'member_since',
        'bio',
        'avatar_path',
        'is_anonymous',
        'notification_preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'failed_login_attempts',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'phone_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_secret' => 'encrypted',
            'two_factor_enabled' => 'boolean',
            'is_anonymous' => 'boolean',
            'notification_preferences' => 'array',
            'status' => UserStatus::class,
            'member_since' => 'datetime',
        ];
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * Get the route key for the model.
     *
     * @return string
     */
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

    public function getNumericKycTier(): int
    {
        $raw = $this->kyc_tier;
        if (is_numeric($raw)) {
            return (int) $raw;
        }
        return match (strtolower((string) $raw)) {
            'tier_3', 'enhanced' => 3,
            'tier_2', 'verified' => 2,
            'tier_1', 'basic' => 1,
            default => 0,
        };
    }

    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    public function auctions()
    {
        return $this->hasMany(Auction::class, 'seller_id');
    }

    public function bids()
    {
        return $this->hasMany(Bid::class, 'bidder_id');
    }

    public function watchedAuctions()
    {
        return $this->belongsToMany(Auction::class, 'watchlist')
            ->withPivot(['notify_outbid', 'notify_ending_soon', 'notify_price_drop'])
            ->withTimestamps();
    }

    public function purchases()
    {
        return $this->hasMany(Transaction::class, 'buyer_id');
    }

    public function sales()
    {
        return $this->hasMany(Transaction::class, 'seller_id');
    }

    public function transactions()
    {
        return Transaction::where(function ($q) {
            $q->where('buyer_id', $this->id)
              ->orWhere('seller_id', $this->id);
        });
    }

    public function kycDocuments()
    {
        return $this->hasMany(KycDocument::class);
    }
}
