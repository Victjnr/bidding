<?php

namespace App\Models;

use App\Enums\DisputeReason;
use App\Enums\DisputeStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Dispute extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'transaction_id',
        'opened_by_user_id',
        'reason',
        'status',
        'description',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'reason' => DisputeReason::class,
        'status' => DisputeStatus::class,
        'resolved_at' => 'datetime',
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

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function opener(): BelongsTo
    {
        return $this->belongsTo(User::class, 'opened_by_user_id');
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(DisputeEvidence::class);
    }
}
