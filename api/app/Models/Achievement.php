<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Achievement extends Model
{
    use HasPublicId;

    protected $fillable = [
        'public_id',
        'code',
        'daughter_id',
        'title',
        'description',
        'icon',
        'category',
        'unlocked',
        'unlocked_at',
        'current_progress',
        'total_goal',
        'reward_points',
    ];

    protected function casts(): array
    {
        return [
            'unlocked' => 'boolean',
            'unlocked_at' => 'datetime',
        ];
    }

    public function daughter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'daughter_id');
    }
}
