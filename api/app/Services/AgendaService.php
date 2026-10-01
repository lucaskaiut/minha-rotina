<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Support\Weekdays;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class AgendaService
{
    /**
     * Tarefas programadas para uma filha numa data (template semanal expandido).
     *
     * @return Collection<int, Task>
     */
    public function tasksForDate(User $daughter, CarbonInterface $date): Collection
    {
        $weekday = Weekdays::code($date);
        $dateString = $date->toDateString();

        return Task::query()
            ->where('daughter_id', $daughter->id)
            ->where(function ($query) use ($weekday, $dateString): void {
                $query->where(function ($weekly) use ($weekday): void {
                    $weekly->whereNull('task_date')->whereJsonContains('weekdays', $weekday);
                })->orWhereDate('task_date', $dateString);
            })
            ->with([
                'daughter',
                'completions' => fn ($query) => $query->whereDate('date', $dateString),
            ])
            ->orderBy('start_time')
            ->get();
    }

    public function completionFor(Task $task, CarbonInterface $date): ?TaskCompletion
    {
        $dateString = $date->toDateString();

        if ($task->relationLoaded('completions')) {
            return $task->completions->first(
                fn (TaskCompletion $completion) => $completion->date->toDateString() === $dateString,
            );
        }

        return $task->completions()
            ->whereDate('date', $dateString)
            ->first();
    }

    public function ensureCompletion(Task $task, CarbonInterface $date): TaskCompletion
    {
        return TaskCompletion::firstOrCreate(
            ['task_id' => $task->id, 'date' => $date->toDateString()],
            ['daughter_id' => $task->daughter_id, 'status' => 'pendente'],
        );
    }

    public function statusFor(Task $task, ?TaskCompletion $completion, CarbonInterface $date, ?CarbonInterface $now = null): string
    {
        if ($completion?->isCompleted()) {
            return 'concluido';
        }

        $now = $now ?? Carbon::now();
        $start = Carbon::parse($date->toDateString().' '.$task->start_time);
        $due = Carbon::parse($date->toDateString().' '.$task->due_time);

        if ($now->greaterThan($due)) {
            return 'atrasado';
        }

        if ($now->greaterThanOrEqualTo($start)) {
            return 'em_andamento';
        }

        return 'pendente';
    }

    /**
     * Projeção da tarefa para a data (formato consumido pelo frontend).
     */
    public function present(Task $task, CarbonInterface $date, ?CarbonInterface $now = null): array
    {
        $completion = $this->completionFor($task, $date);

        return [
            'id' => $task->public_id,
            'daughterId' => $task->daughter->public_id,
            'title' => $task->title,
            'description' => $task->description,
            'category' => $task->category,
            'difficulty' => $task->difficulty,
            'weekdays' => $task->weekdays,
            'repeat' => $task->task_date ? 'once' : 'weekly',
            'scheduledDate' => $task->task_date?->toDateString(),
            'startTime' => substr((string) $task->start_time, 0, 5),
            'dueTime' => substr((string) $task->due_time, 0, 5),
            'points' => $task->points,
            'status' => $this->statusFor($task, $completion, $date, $now),
            'completedAt' => $completion?->completed_at?->format('H:i'),
            'completedByDaughter' => (bool) ($completion?->completed_by_daughter),
            'date' => $date->toDateString(),
        ];
    }

    /**
     * Série diária para gráficos (data final + N dias para trás).
     *
     * @return array<int, array{date:string,dayName:string,total:int,completed:int,rate:int}>
     */
    public function daySeries(User $daughter, CarbonInterface $endDate, int $days = 7): array
    {
        $series = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $endDate->copy()->subDays($i);
            $stats = $this->dayStats($daughter, $date);

            $series[] = [
                'date' => $date->format('d/m'),
                'dayName' => Weekdays::label($date),
                'total' => $stats['total'],
                'completed' => $stats['completed'],
                'rate' => $stats['rate'],
            ];
        }

        return $series;
    }

    /**
     * Estatísticas de um dia para uma filha.
     *
     * @return array{total:int,completed:int,late:int,inProgress:int,pending:int,rate:int}
     */
    public function dayStats(User $daughter, CarbonInterface $date): array
    {
        $presented = $this->tasksForDate($daughter, $date)
            ->map(fn (Task $task) => $this->present($task, $date));

        $total = $presented->count();
        $completed = $presented->where('status', 'concluido')->count();

        return [
            'total' => $total,
            'completed' => $completed,
            'late' => $presented->where('status', 'atrasado')->count(),
            'inProgress' => $presented->where('status', 'em_andamento')->count(),
            'pending' => $presented->where('status', 'pendente')->count(),
            'rate' => $total > 0 ? (int) round($completed / $total * 100) : 0,
        ];
    }
}
