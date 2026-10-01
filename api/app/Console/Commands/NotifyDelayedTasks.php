<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\NotificationRule;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class NotifyDelayedTasks extends Command
{
    protected $signature = 'rotina:notify-delays';

    protected $description = 'Avisa a mãe quando uma tarefa passa do horário limite sem conclusão';

    public function handle(AgendaService $agenda, NotificationService $notifications): int
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        $rules = NotificationRule::query()
            ->where('enabled', true)
            ->where('notify_mother_on_delay', true)
            ->get();

        foreach ($rules as $rule) {
            $mother = User::query()
                ->where('family_id', $rule->family_id)
                ->where('role', UserRole::Mother)
                ->first();

            if (! $mother) {
                continue;
            }

            $daughters = User::query()
                ->where('family_id', $rule->family_id)
                ->where('role', UserRole::Daughter)
                ->where('profile_status', 'active')
                ->get();

            foreach ($daughters as $daughter) {
                foreach ($agenda->tasksForDate($daughter, $today) as $task) {
                    $completion = $agenda->completionFor($task, $today);

                    if ($completion?->isCompleted()) {
                        continue;
                    }

                    $due = Carbon::parse($today->toDateString().' '.$task->due_time);
                    $threshold = $due->copy()->addMinutes(30);

                    if ($now->lessThan($threshold) || $now->greaterThan($due->copy()->addHours(6))) {
                        continue;
                    }

                    $record = $agenda->ensureCompletion($task, $today);

                    if ($record->late_notified_at) {
                        continue;
                    }

                    $record->forceFill(['late_notified_at' => $now])->save();

                    $firstName = explode(' ', $daughter->name)[0];

                    $notifications->create(
                        $mother,
                        'mother',
                        "Atenção: {$firstName} ainda não concluiu uma tarefa",
                        '"'.$task->title.'" tinha horário limite às '.substr((string) $task->due_time, 0, 5).'.',
                        'alert',
                    );
                }
            }
        }

        return self::SUCCESS;
    }
}
