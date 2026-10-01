<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\DayBonusService;
use App\Services\StreakService;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    public const CATEGORIES = ['estudos', 'saude', 'casa', 'lazer', 'habito'];

    public function __construct(
        private readonly StreakService $streaks,
        private readonly DayBonusService $dayBonuses,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'period' => ['sometimes', Rule::in(['daily', 'weekly', 'monthly'])],
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'daughter_id' => ['sometimes', 'string'],
        ]);

        $actor = $request->user();
        $period = $data['period'] ?? 'weekly';
        $anchor = Carbon::parse($data['date'] ?? Carbon::today()->toDateString());
        $daughter = $this->resolveDaughter($actor, $data['daughter_id'] ?? null);

        [$start, $end, $series] = match ($period) {
            'daily' => [$anchor->copy(), $anchor->copy(), $this->daySeries($daughter, $anchor, 7)],
            'monthly' => [$anchor->copy()->subDays(27), $anchor->copy(), $this->weeklyBuckets($daughter, $anchor)],
            default => [$anchor->copy()->subDays(6), $anchor->copy(), $this->daySeries($daughter, $anchor, 7)],
        };

        $tasks = Task::query()->where('daughter_id', $daughter->id)->get();
        $completions = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->with('task')
            ->get();

        $scheduled = $this->scheduledCount($tasks, $start, $end);
        $completed = $completions->count();
        $rate = $scheduled > 0 ? (int) round($completed / $scheduled * 100) : 0;

        $onTime = $completions->filter(
            fn (TaskCompletion $completion) => $completion->task
                && $completion->completed_at->format('H:i') <= substr((string) $completion->task->due_time, 0, 5),
        )->count();

        $length = $start->diffInDays($end) + 1;
        $previousScheduled = $this->scheduledCount(
            $tasks,
            $start->copy()->subDays($length),
            $start->copy()->subDay(),
        );
        $previousCompleted = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->whereDate('date', '>=', $start->copy()->subDays($length)->toDateString())
            ->whereDate('date', '<', $start->toDateString())
            ->count();
        $previousRate = $previousScheduled > 0
            ? (int) round($previousCompleted / $previousScheduled * 100)
            : 0;

        return response()->json([
            'period' => $period,
            'range' => [
                'start' => $start->toDateString(),
                'end' => $end->toDateString(),
            ],
            'daughter' => [
                'id' => $daughter->public_id,
                'name' => $daughter->name,
                'streakDays' => $this->streaks->sync($daughter),
                'totalPoints' => $daughter->total_points,
            ],
            'summary' => [
                'rate' => $rate,
                'punctuality' => $completed > 0 ? (int) round($onTime / $completed * 100) : 0,
                'points' => (int) $completions->sum('points_awarded')
                    + $this->dayBonuses->pointsInRange($daughter, $start, $end),
                'totalScheduled' => $scheduled,
                'totalCompleted' => $completed,
                'totalMissed' => max(0, $scheduled - $completed),
                'rateTrend' => [
                    'value' => $rate - $previousRate,
                    'positive' => $rate >= $previousRate,
                ],
            ],
            'series' => $series,
            'categories' => $this->categories($tasks, $completions, $start, $end),
        ]);
    }

    /**
     * @return array<int, array{date:string,dayName:string,total:int,completed:int,rate:int}>
     */
    private function daySeries(User $daughter, Carbon $endDate, int $days): array
    {
        return app(AgendaService::class)->daySeries($daughter, $endDate, $days);
    }

    /**
     * @return array<int, array{date:string,dayName:string,total:int,completed:int,rate:int}>
     */
    private function weeklyBuckets(User $daughter, Carbon $anchor): array
    {
        $tasks = Task::query()->where('daughter_id', $daughter->id)->get();
        $buckets = [];

        for ($week = 3; $week >= 0; $week--) {
            $weekEnd = $anchor->copy()->subWeeks($week)->endOfDay();
            $weekStart = $weekEnd->copy()->subDays(6)->startOfDay();

            $scheduled = $this->scheduledCount($tasks, $weekStart, $weekEnd);
            $completed = TaskCompletion::query()
                ->where('daughter_id', $daughter->id)
                ->whereNotNull('completed_at')
                ->whereDate('date', '>=', $weekStart->toDateString())
                ->whereDate('date', '<=', $weekEnd->toDateString())
                ->count();

            $buckets[] = [
                'date' => $weekStart->format('d/m'),
                'dayName' => 'Sem '.$weekStart->format('W'),
                'total' => $scheduled,
                'completed' => $completed,
                'rate' => $scheduled > 0 ? (int) round($completed / $scheduled * 100) : 0,
            ];
        }

        return $buckets;
    }

    /**
     * @param  Collection<int, Task>  $tasks
     */
    private function scheduledCount(Collection $tasks, Carbon $start, Carbon $end): int
    {
        $count = 0;

        for ($date = $start->copy()->startOfDay(); $date->lessThanOrEqualTo($end); $date->addDay()) {
            $count += $tasks->filter(fn (Task $task) => $task->occursOn($date))->count();
        }

        return $count;
    }

    /**
     * @param  Collection<int, Task>  $tasks
     * @param  Collection<int, TaskCompletion>  $completions
     * @return array<int, array{key:string,completed:int,total:int,rate:int}>
     */
    private function categories(Collection $tasks, Collection $completions, Carbon $start, Carbon $end): array
    {
        $result = [];

        foreach (self::CATEGORIES as $category) {
            $categoryTasks = $tasks->where('category', $category);
            $total = $this->scheduledCount($categoryTasks, $start, $end);
            $completed = $completions->filter(
                fn (TaskCompletion $completion) => $completion->task?->category === $category,
            )->count();

            $result[] = [
                'key' => $category,
                'completed' => $completed,
                'total' => $total,
                'rate' => $total > 0 ? (int) round($completed / $total * 100) : 0,
            ];
        }

        return $result;
    }

    private function resolveDaughter(User $actor, ?string $daughterId): User
    {
        if ($actor->isDaughter()) {
            return $actor;
        }

        if ($daughterId) {
            return FamilyContext::resolveDaughter($actor, $daughterId);
        }

        $first = User::query()
            ->where('role', UserRole::Daughter)
            ->where('mother_id', $actor->id)
            ->orderBy('name')
            ->first();

        abort_unless($first, 404, 'Nenhuma filha cadastrada.');

        return $first;
    }
}
