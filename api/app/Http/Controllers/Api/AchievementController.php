<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Achievement;
use App\Models\DayBonus;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\LevelService;
use App\Support\ApiPresenter;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    public function __construct(private readonly AchievementService $achievements) {}

    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'daughter_id' => ['sometimes', 'string'],
        ]);

        $actor = $request->user();
        $daughter = $this->resolveDaughter($actor, (string) $request->input('daughter_id'));

        // Garante catálogo atualizado para contas antigas.
        $this->achievements->seedFor($daughter);

        $achievements = Achievement::query()
            ->where('daughter_id', $daughter->id)
            ->orderBy('id')
            ->get()
            ->map(fn (Achievement $achievement) => ApiPresenter::achievement($achievement))
            ->values();

        $weeklyStart = Carbon::now()->startOfWeek(Carbon::MONDAY);
        $monthlyStart = Carbon::now()->startOfMonth();
        $now = Carbon::now();

        $weeklyPoints = $this->pointsEarned($daughter, $weeklyStart, $now);
        $monthlyPoints = $this->pointsEarned($daughter, $monthlyStart, $now);

        $weeklyGoal = max(1, (int) config('rotina.weekly_goal', 300));
        $monthlyGoal = max(1, (int) config('rotina.monthly_goal', 1200));

        return response()->json([
            'data' => $achievements,
            'points' => [
                'total' => $daughter->total_points,
                'level' => LevelService::levelFor($daughter->total_points),
                'nextLevelPoints' => LevelService::thresholdFor(LevelService::levelFor($daughter->total_points)),
                'levelProgress' => LevelService::progressPercent($daughter->total_points),
                'streakDays' => $daughter->streak_days,
                'weekly' => [
                    'points' => $weeklyPoints,
                    'goal' => $weeklyGoal,
                    'progress' => min(100, (int) round($weeklyPoints / $weeklyGoal * 100)),
                ],
                'monthly' => [
                    'points' => $monthlyPoints,
                    'goal' => $monthlyGoal,
                    'progress' => min(100, (int) round($monthlyPoints / $monthlyGoal * 100)),
                ],
            ],
        ]);
    }

    private function pointsEarned(User $daughter, CarbonInterface $start, CarbonInterface $end): int
    {
        $completions = (int) TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->sum('points_awarded');

        $bonuses = (int) DayBonus::query()
            ->where('daughter_id', $daughter->id)
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->sum('total_points');

        return $completions + $bonuses;
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
