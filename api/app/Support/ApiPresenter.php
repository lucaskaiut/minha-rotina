<?php

namespace App\Support;

use App\Models\Achievement;
use App\Models\AppNotification;
use App\Models\NotificationRule;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

final class ApiPresenter
{
    private const MONTHS_PT = [
        1 => 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
    ];

    public static function authUser(User $user): array
    {
        return [
            'id' => $user->public_id,
            'internalId' => $user->id,
            'role' => $user->role->value,
            'name' => $user->name,
            'email' => $user->email,
            'familyId' => $user->family_id,
            'familyName' => $user->family?->name,
            'daughterId' => $user->isDaughter() ? $user->public_id : null,
            'avatarUrl' => $user->avatar_url,
            'birthdate' => $user->birthdate?->format('Y-m-d'),
            'schoolGrade' => $user->school_grade,
        ];
    }

    public static function daughter(User $daughter, ?int $completedToday = null, ?int $totalToday = null): array
    {
        $age = $daughter->birthdate
            ? Carbon::parse($daughter->birthdate)->age
            : 0;

        return [
            'id' => $daughter->public_id,
            'name' => $daughter->name,
            'age' => $age,
            'avatarUrl' => $daughter->avatar_url ?? '',
            'status' => $daughter->profile_status,
            'streakDays' => $daughter->streak_days,
            'totalPoints' => $daughter->total_points,
            'completedTodayCount' => $completedToday ?? 0,
            'totalTodayCount' => $totalToday ?? 0,
            'schoolGrade' => $daughter->school_grade ?? '',
            'birthdate' => $daughter->birthdate?->format('Y-m-d'),
        ];
    }

    public static function task(Task $task): array
    {
        return [
            'id' => $task->public_id,
            'daughterId' => $task->daughter->public_id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category,
            'difficulty' => $task->difficulty,
            'weekdays' => $task->weekdays,
            'startTime' => $task->start_time,
            'dueTime' => $task->due_time,
            'points' => $task->points,
            'status' => $task->status,
            'completedAt' => $task->completed_at,
            'completedByDaughter' => $task->completed_by_daughter,
        ];
    }

    public static function achievement(Achievement $achievement): array
    {
        return [
            'id' => $achievement->public_id,
            'title' => $achievement->title,
            'description' => $achievement->description,
            'icon' => $achievement->icon,
            'category' => $achievement->category,
            'unlocked' => $achievement->unlocked,
            'unlockedAt' => $achievement->unlocked_at
                ? sprintf('%d de %s', $achievement->unlocked_at->day, self::MONTHS_PT[$achievement->unlocked_at->month])
                : null,
            'currentProgress' => $achievement->current_progress,
            'totalGoal' => $achievement->total_goal,
            'rewardPoints' => $achievement->reward_points,
        ];
    }

    public static function notificationRule(NotificationRule $rule): array
    {
        return [
            'id' => $rule->public_id,
            'enabled' => $rule->enabled,
            'frequency' => $rule->frequency,
            'startTime' => $rule->start_time,
            'endTime' => $rule->end_time,
            'notifyMotherOnComplete' => $rule->notify_mother_on_complete,
            'notifyMotherOnDelay' => $rule->notify_mother_on_delay,
            'daughterReminderMinutesBefore' => $rule->daughter_reminder_minutes_before,
        ];
    }

    public static function notification(AppNotification $notification): array
    {
        return [
            'id' => $notification->public_id,
            'recipient' => $notification->recipient,
            'title' => $notification->title,
            'message' => $notification->message,
            'timestamp' => $notification->created_at?->locale('pt_BR')->diffForHumans() ?? 'Agora',
            'read' => $notification->read,
            'type' => $notification->type,
        ];
    }
}
