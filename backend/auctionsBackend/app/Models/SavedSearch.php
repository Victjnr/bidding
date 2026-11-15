<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class SavedSearch extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'user_id',
        'name',
        'filters', // JSON
        'frequency', // e.g. daily, real-time
        'last_run_at',
        'last_result_count',
    ];

    protected $casts = [
        'filters' => 'array',
        'last_run_at' => 'datetime',
        'last_result_count' => 'integer',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
