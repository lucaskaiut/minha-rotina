<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\DayBonus;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\AgendaService;
use App\Services\StreakService;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function __construct(
        private readonly AgendaService $agenda,
        private readonly StreakService $streaks,
    ) {}

    public function summary(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'daughter_id' => ['sometimes', 'string'],
        ]);

        $actor = $request->user();
        $date = Carbon::parse($data['date'] ?? Carbon::today()->toDateString());
        $daughter = $this->resolveDaughter($actor, $data['daughter_id'] ?? null);

        $presented = $this->agenda->tasksForDate($daughter, $date)
            ->map(fn ($task) => $this->agenda->present($task, $date));

        $total = $presented->count();
        $completed = $presented->where('status', 'concluido')->count();
        $rate = $total > 0 ? (int) round($completed / $total * 100) : 0;

        $series = $this->agenda->daySeries($daughter, $date, 7);
        $averageRate = (int) round(collect($series)->avg('rate') ?? 0);
        $previousAverage = (int) round(collect(
            $this->agenda->daySeries($daughter, $date->copy()->subDays(7), 7),
        )->avg('rate') ?? 0);

        $pointsToday = (int) TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', $date)
            ->whereNotNull('completed_at')
            ->sum('points_awarded');

        $pointsToday += (int) DayBonus::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', $date)
            ->value('total_points');

        $recentCompleted = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', $date)
            ->whereNotNull('completed_at')
            ->with('task.daughter')
            ->latest('completed_at')
            ->take(3)
            ->get()
            ->map(fn (TaskCompletion $completion) => $this->agenda->present($completion->task, $date))
            ->values();

        $nextTask = $presented->first(
            fn (array $task) => in_array($task['status'], ['em_andamento', 'pendente'], true),
        );

        return response()->json([
            'date' => $date->toDateString(),
            'daughter' => [
                'id' => $daughter->public_id,
                'name' => $daughter->name,
                'streakDays' => $this->streaks->sync($daughter),
                'totalPoints' => $daughter->total_points,
            ],
            'totals' => [
                'total' => $total,
                'completed' => $completed,
                'pending' => $presented->where('status', 'pendente')->count(),
                'inProgress' => $presented->where('status', 'em_andamento')->count(),
                'late' => $presented->where('status', 'atrasado')->count(),
                'completionRate' => $rate,
            ],
            'pointsToday' => (int) $pointsToday,
            'averageRate' => $averageRate,
            'rateTrend' => [
                'value' => $averageRate - $previousAverage,
                'positive' => $averageRate >= $previousAverage,
            ],
            'nextTask' => $nextTask,
            'recentCompleted' => $recentCompleted,
            'weeklySeries' => $series,
        ]);
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
