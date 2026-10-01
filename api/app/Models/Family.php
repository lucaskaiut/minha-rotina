<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Family extends Model
{
    protected $fillable = ['name'];

    /** @return HasMany<User, $this> */
    public function members(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** @return HasOne<NotificationRule, $this> */
    public function notificationRule(): HasOne
    {
        return $this->hasOne(NotificationRule::class);
    }

    /** @return HasMany<Task, $this> */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /** @return HasMany<AppNotification, $this> */
    public function notifications(): HasMany
    {
        return $this->hasMany(AppNotification::class);
    }
}
