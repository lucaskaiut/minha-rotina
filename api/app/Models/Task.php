<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use App\Support\Weekdays;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasPublicId;

    protected $fillable = [
        'public_id',
        'family_id',
        'daughter_id',
        'title',
        'description',
        'category',
        'difficulty',
        'weekdays',
        'task_date',
        'start_time',
        'due_time',
        'points',
        'status',
        'completed_at',
        'completed_by_daughter',
    ];

    protected function casts(): array
    {
        return [
            'weekdays' => 'array',
            'task_date' => 'date:Y-m-d',
            'completed_by_daughter' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    /**
     * A tarefa ocorre na data? (data única ou dia da semana recorrente)
     */
    public function occursOn(CarbonInterface $date): bool
    {
        if ($this->task_date) {
            return $this->task_date->toDateString() === $date->toDateString();
        }

        return in_array(Weekdays::code($date), $this->weekdays ?? [], true);
    }

    public function isOneTime(): bool
    {
        return $this->task_date !== null;
    }

    public function daughter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'daughter_id');
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    /** @return HasMany<TaskCompletion, $this> */
    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }
}
