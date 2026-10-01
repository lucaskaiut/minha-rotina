<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskCompletion extends Model
{
    protected $fillable = [
        'task_id',
        'daughter_id',
        'date',
        'status',
        'completed_at',
        'completed_by',
        'completed_by_daughter',
        'base_points',
        'bonus_points',
        'points_awarded',
        'bonus_breakdown',
        'reminder_sent_at',
        'late_notified_at',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date:Y-m-d',
            'completed_at' => 'datetime',
            'completed_by_daughter' => 'boolean',
            'bonus_breakdown' => 'array',
            'reminder_sent_at' => 'datetime',
            'late_notified_at' => 'datetime',
        ];
    }

    public static function basePointsForDifficulty(?string $difficulty): ?int
    {
        if (! $difficulty) {
            return null;
        }

        $map = config('rotina.difficulty_points', []);

        return isset($map[$difficulty]) ? (int) $map[$difficulty] : null;
    }

    public static function difficultyForPoints(int $points): string
    {
        $map = config('rotina.difficulty_points', []);
        $difficulty = 'easy';

        foreach ($map as $key => $value) {
            if ($points >= (int) $value) {
                $difficulty = $key;
            }
        }

        return $difficulty;
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function daughter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'daughter_id');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    public function isCompleted(): bool
    {
        return $this->completed_at !== null;
    }
}
