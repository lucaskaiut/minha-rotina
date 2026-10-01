<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DayBonus extends Model
{
    protected $fillable = [
        'daughter_id',
        'date',
        'base_points',
        'perfect_bonus',
        'variety_bonus',
        'streak_multiplier',
        'streak_bonus',
        'total_points',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'streak_multiplier' => 'float',
        ];
    }

    public function daughter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'daughter_id');
    }
}
