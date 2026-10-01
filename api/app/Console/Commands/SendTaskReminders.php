<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\NotificationRule;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class SendTaskReminders extends Command
{
    protected $signature = 'rotina:send-reminders';

    protected $description = 'Envia lembretes de tarefas para as filhas conforme a regra da família';

    public function handle(AgendaService $agenda, NotificationService $notifications): int
    {
        $now = Carbon::now();
        $today = $now->copy()->startOfDay();

        $rules = NotificationRule::query()->where('enabled', true)->get();

        foreach ($rules as $rule) {
            if (! $this->insideWindow($now, $rule)) {
                continue;
            }

            $daughters = User::query()
                ->where('family_id', $rule->family_id)
                ->where('role', UserRole::Daughter)
                ->where('profile_status', 'active')
                ->get();

            foreach ($daughters as $daughter) {
                if ($rule->frequency === 'suave') {
                    $this->sendSoftSummary($now, $rule, $daughter, $agenda, $notifications);

                    continue;
                }

                $tasks = $agenda->tasksForDate($daughter, $today);

                foreach ($tasks as $task) {
                    $completion = $agenda->completionFor($task, $today);

                    if ($completion?->isCompleted()) {
                        continue;
                    }

                    $start = Carbon::parse($today->toDateString().' '.$task->start_time);
                    $reminderAt = $start->copy()->subMinutes((int) $rule->daughter_reminder_minutes_before);

                    if ($now->betweenIncluded($reminderAt, $reminderAt->copy()->addMinutes(5))) {
                        $record = $agenda->ensureCompletion($task, $today);

                        if (! $record->reminder_sent_at) {
                            $record->forceFill(['reminder_sent_at' => $now])->save();

                            $notifications->create(
                                $daughter,
                                'daughter',
                                'Hora da próxima atividade!',
                                $task->title.' começa às '.substr((string) $task->start_time, 0, 5).'. Bora lá? 💪',
                                'reminder',
                            );
                        }
                    }

                    if ($rule->frequency === 'alta') {
                        $due = Carbon::parse($today->toDateString().' '.$task->due_time);
                        $key = "rotina:due-reminder:{$task->id}:{$today->toDateString()}";

                        if (
                            $now->betweenIncluded($due, $due->copy()->addMinutes(5))
                            && Cache::add($key, true, now()->addHours(20))
                        ) {
                            $notifications->create(
                                $daughter,
                                'daughter',
                                'O prazo está chegando!',
                                $task->title.': o horário limite é '.substr((string) $task->due_time, 0, 5).'.',
                                'alert',
                            );
                        }
                    }
                }
            }
        }

        return self::SUCCESS;
    }

    private function sendSoftSummary(
        Carbon $now,
        NotificationRule $rule,
        User $daughter,
        AgendaService $agenda,
        NotificationService $notifications,
    ): void {
        $today = $now->copy()->startOfDay();
        $windowStart = Carbon::parse($today->toDateString().' '.$rule->start_time);
        $windowEnd = Carbon::parse($today->toDateString().' '.$rule->end_time);

        $stats = $agenda->dayStats($daughter, $today);

        if ($stats['total'] === 0) {
            return;
        }

        if ($now->betweenIncluded($windowStart, $windowStart->copy()->addMinutes(5))) {
            $key = "rotina:soft:morning:{$daughter->id}:{$today->toDateString()}";

            if (! Cache::add($key, true, now()->addHours(20))) {
                return;
            }

            $notifications->create(
                $daughter,
                'daughter',
                'Sua rotina de hoje chegou!',
                "Você tem {$stats['total']} atividades programadas para hoje. Vamos começar? ✨",
                'reminder',
            );

            return;
        }

        if ($now->betweenIncluded($windowEnd->copy()->subMinutes(5), $windowEnd)) {
            $key = "rotina:soft:evening:{$daughter->id}:{$today->toDateString()}";

            if (! Cache::add($key, true, now()->addHours(20))) {
                return;
            }

            $notifications->create(
                $daughter,
                'daughter',
                'Resumo do seu dia',
                "Você concluiu {$stats['completed']} de {$stats['total']} atividades hoje. Amanhã tem mais! 🌙",
                'reminder',
            );
        }
    }

    private function insideWindow(Carbon $now, NotificationRule $rule): bool
    {
        $start = Carbon::parse($now->toDateString().' '.$rule->start_time);
        $end = Carbon::parse($now->toDateString().' '.$rule->end_time);

        return $now->betweenIncluded($start, $end);
    }
}
