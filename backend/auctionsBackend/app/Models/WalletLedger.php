<?php

namespace App\Models;

use App\Enums\WalletEntryType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WalletLedger extends Model
{
    use HasFactory;

    /**
     * @var string
     */
    protected $table = 'wallet_ledger';

    protected $fillable = [
        'uuid',
        'user_id',
        'transaction_id',
        'type',
        'amount',
        'currency',
        'description',
    ];

    protected $casts = [
        'type' => WalletEntryType::class,
        'amount' => 'decimal:2',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }
}
