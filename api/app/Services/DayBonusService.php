<?php

namespace App\Services;

use App\Models\DayBonus;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use Carbon\CarbonInterface;

class DayBonusService
{
    public function __construct(private readonly StreakService $streaks) {}

    /**
     * Recalcula (idempotente) o bônus de fechamento do dia:
     * dia perfeito + variedade de categorias + multiplicador de sequência.
     * Ajusta `total_points` pela diferença em relação ao valor anterior.
     */
    public function recalculate(User $daughter, CarbonInterface $date): ?DayBonus
    {
        $dateString = $date->toDateString();

        $scheduled = Task::query()
            ->where('daughter_id', $daughter->id)
            ->get()
            ->filter(fn (Task $task) => $task->occursOn($date));

        $completions = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', $dateString)
            ->whereNotNull('completed_at')
            ->with('task')
            ->get();

        $existing = DayBonus::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', $dateString)
            ->first();

        if ($scheduled->isEmpty() || $completions->isEmpty()) {
            if ($existing) {
                $daughter->decrement('total_points', min($existing->total_points, $daughter->total_points));
                $existing->delete();
            }

            return null;
        }

        $config = config('rotina.bonuses');

        $base = (int) $completions->sum('base_points');

        $perfect = $scheduled->every(
            fn (Task $task) => $completions->contains('task_id', $task->id),
        );

        $categories = $completions
            ->map(fn (TaskCompletion $completion) => $completion->task?->category)
            ->filter()
            ->unique()
            ->count();

        $streak = $this->streaks->calculate($daughter, $date);
        $multiplier = 1.0;

        foreach ($config['streak_tiers'] as $days => $tier) {
            if ($streak >= (int) $days) {
                $multiplier = (float) $tier;
            }
        }

        $perfectBonus = $perfect ? (int) $config['perfect_day'] : 0;
        $varietyBonus = $categories >= 3 ? (int) $config['variety'] : 0;
        $streakBonus = $multiplier > 1 ? (int) floor($base * ($multiplier - 1)) : 0;

        $total = $perfectBonus + $varietyBonus + $streakBonus;
        $previous = (int) ($existing?->total_points ?? 0);

        $bonus = DayBonus::query()->updateOrCreate(
            ['daughter_id' => $daughter->id, 'date' => $dateString],
            [
                'base_points' => $base,
                'perfect_bonus' => $perfectBonus,
                'variety_bonus' => $varietyBonus,
                'streak_multiplier' => $multiplier,
                'streak_bonus' => $streakBonus,
                'total_points' => $total,
            ],
        );

        $delta = $total - $previous;

        if ($delta > 0) {
            $daughter->increment('total_points', $delta);
        } elseif ($delta < 0) {
            $daughter->decrement('total_points', min(abs($delta), $daughter->total_points));
        }

        return $bonus;
    }

    /**
     * Pontos de bônus de fechamento num período.
     */
    public function pointsInRange(User $daughter, CarbonInterface $start, CarbonInterface $end): int
    {
        return (int) DayBonus::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->sum('total_points');
    }
}
