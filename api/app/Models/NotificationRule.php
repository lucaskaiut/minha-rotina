<?php

namespace App\Models;

use App\Models\Concerns\HasPublicId;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NotificationRule extends Model
{
    use HasPublicId;

    protected $fillable = [
        'public_id',
        'family_id',
        'enabled',
        'frequency',
        'start_time',
        'end_time',
        'notify_mother_on_complete',
        'notify_mother_on_delay',
        'daughter_reminder_minutes_before',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'notify_mother_on_complete' => 'boolean',
            'notify_mother_on_delay' => 'boolean',
        ];
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }
}
