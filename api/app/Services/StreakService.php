<?php

namespace App\Services;

use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class StreakService
{
    /**
     * Recalcula a sequência de dias em que a filha concluiu 100% das tarefas.
     * Dias sem tarefas programadas não quebram a sequência.
     */
    public function sync(User $daughter, ?CarbonInterface $today = null): int
    {
        $streak = $this->calculate($daughter, $today);

        $daughter->forceFill(['streak_days' => $streak])->save();

        return $streak;
    }

    /**
     * Calcula a sequência até a data sem gravar no usuário.
     */
    public function calculate(User $daughter, ?CarbonInterface $today = null): int
    {
        $today = ($today ?? Carbon::today())->copy()->startOfDay();

        $tasks = Task::query()->where('daughter_id', $daughter->id)->get();

        if ($tasks->isEmpty()) {
            return 0;
        }

        $completions = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->whereDate('date', '<=', $today->toDateString())
            ->get()
            ->groupBy(fn (TaskCompletion $completion) => $completion->date->toDateString());

        $streak = 0;
        $date = $today->copy();

        for ($i = 0; $i < 366; $i++) {
            /** @var Collection<int, Task> $scheduled */
            $scheduled = $tasks->filter(fn (Task $task) => $task->occursOn($date));

            if ($scheduled->isNotEmpty()) {
                $done = $completions->get($date->toDateString(), collect());
                $allDone = $scheduled->every(
                    fn (Task $task) => $done->contains('task_id', $task->id),
                );

                if ($allDone) {
                    $streak++;
                } elseif ($i > 0) {
                    break;
                }
            }

            $date->subDay();
        }

        return $streak;
    }
}
