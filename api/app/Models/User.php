<?php

namespace App\Models;

use App\Enums\UserRole;
use App\Models\Concerns\HasPublicId;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'public_id',
    'name',
    'email',
    'password',
    'role',
    'family_id',
    'mother_id',
    'avatar_url',
    'birthdate',
    'school_grade',
    'profile_status',
    'streak_days',
    'total_points',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, HasPublicId, Notifiable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'role' => UserRole::class,
            'birthdate' => 'date',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'public_id';
    }

    public function isMother(): bool
    {
        return $this->role === UserRole::Mother;
    }

    public function isDaughter(): bool
    {
        return $this->role === UserRole::Daughter;
    }

    public function family(): BelongsTo
    {
        return $this->belongsTo(Family::class);
    }

    public function mother(): BelongsTo
    {
        return $this->belongsTo(self::class, 'mother_id');
    }

    /** @return HasMany<User, $this> */
    public function daughters(): HasMany
    {
        return $this->hasMany(self::class, 'mother_id');
    }

    /** @return HasMany<Task, $this> */
    public function tasksAsDaughter(): HasMany
    {
        return $this->hasMany(Task::class, 'daughter_id');
    }

    /** @return HasMany<Achievement, $this> */
    public function achievements(): HasMany
    {
        return $this->hasMany(Achievement::class, 'daughter_id');
    }

    /** @return HasMany<PushSubscription, $this> */
    public function pushSubscriptions(): HasMany
    {
        return $this->hasMany(PushSubscription::class);
    }

    /** @return HasMany<DayBonus, $this> */
    public function dayBonuses(): HasMany
    {
        return $this->hasMany(DayBonus::class, 'daughter_id');
    }
}
