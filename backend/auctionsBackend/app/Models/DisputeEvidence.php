<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisputeEvidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'dispute_id',
        'uploaded_by_user_id',
        'file_path',
        'mime_type',
        'original_filename',
        'is_scanned',
        'is_safe',
    ];

    protected $casts = [
        'is_scanned' => 'boolean',
        'is_safe' => 'boolean',
    ];

    public function dispute(): BelongsTo
    {
        return $this->belongsTo(Dispute::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
