<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationRule;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\AgendaService;
use App\Services\DayBonusService;
use App\Services\NotificationService;
use App\Services\PointsService;
use App\Services\StreakService;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class TaskCompletionController extends Controller
{
    public function __construct(
        private readonly AgendaService $agenda,
        private readonly AchievementService $achievements,
        private readonly StreakService $streaks,
        private readonly NotificationService $notifications,
        private readonly PointsService $points,
        private readonly DayBonusService $dayBonuses,
    ) {}

    public function store(Request $request, Task $task): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeTask($actor, $task);

        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
        ]);

        $date = Carbon::parse($data['date'] ?? Carbon::today()->toDateString());

        if (! $task->occursOn($date)) {
            throw ValidationException::withMessages([
                'date' => ['Esta tarefa não está programada para este dia.'],
            ]);
        }

        $completion = $this->agenda->ensureCompletion($task, $date);

        if ($completion->isCompleted()) {
            return response()->json([
                'message' => 'Tarefa já concluída neste dia.',
            ], 409);
        }

        $completedAt = Carbon::now();

        $firstOfDay = ! TaskCompletion::query()
            ->where('daughter_id', $task->daughter_id)
            ->whereDate('date', $date->toDateString())
            ->whereNotNull('completed_at')
            ->exists();

        $award = $this->points->awardForCompletion($task, $date, $completedAt, $firstOfDay);

        $completion->forceFill([
            'completed_at' => $completedAt,
            'completed_by' => $actor->id,
            'completed_by_daughter' => $actor->isDaughter(),
            'status' => 'concluido',
            'base_points' => $award['base_points'],
            'bonus_points' => $award['bonus_points'],
            'points_awarded' => $award['points_awarded'],
            'bonus_breakdown' => $award['breakdown'],
        ])->save();

        $daughter = $task->daughter;
        $daughter->increment('total_points', $award['points_awarded']);

        $this->streaks->sync($daughter);
        $this->achievements->evaluate($daughter);
        $this->dayBonuses->recalculate($daughter, $date);
        $this->notifyMother($task, $daughter, $completion);

        return response()->json([
            'data' => $this->agenda->present($task->load('daughter'), $date),
            'points' => [
                'awarded' => $award['points_awarded'],
                'base' => $award['base_points'],
                'bonus' => $award['bonus_points'],
                'breakdown' => $award['breakdown'],
            ],
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $actor = $request->user();
        $this->authorizeTask($actor, $task);

        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
        ]);

        $date = Carbon::parse($data['date'] ?? Carbon::today()->toDateString());

        if ($actor->isDaughter() && ! $date->isToday()) {
            abort(403, 'Você só pode desfazer a conclusão do dia de hoje.');
        }

        $completion = TaskCompletion::query()
            ->where('task_id', $task->id)
            ->whereDate('date', $date->toDateString())
            ->first();

        if (! $completion?->isCompleted()) {
            return response()->json(['message' => 'Tarefa ainda não foi concluída.'], 409);
        }

        $daughter = $task->daughter;
        $daughter->decrement('total_points', min($completion->points_awarded, $daughter->total_points));

        $completion->delete();

        $this->streaks->sync($daughter);
        $this->achievements->evaluate($daughter);
        $this->dayBonuses->recalculate($daughter, $date);

        return response()->json([
            'data' => $this->agenda->present($task->load('daughter'), $date),
        ]);
    }

    private function notifyMother(Task $task, User $daughter, TaskCompletion $completion): void
    {
        $rule = NotificationRule::query()->where('family_id', $task->family_id)->first();

        if (! $rule?->notify_mother_on_complete) {
            return;
        }

        $mother = User::query()->find($daughter->mother_id);

        if (! $mother) {
            return;
        }

        $firstName = explode(' ', $daughter->name)[0];

        $this->notifications->create(
            $mother,
            'mother',
            "{$firstName} concluiu uma tarefa!",
            '"'.$task->title.'" finalizada às '.$completion->completed_at->format('H:i').' (+'.$completion->points_awarded.' pts).',
            'congratulations',
        );
    }

    private function authorizeTask(User $actor, Task $task): void
    {
        abort_unless(
            $task->family_id === FamilyContext::familyId($actor),
            403,
            'Tarefa não pertence a esta família.',
        );

        if ($actor->isMother()) {
            abort_unless($task->daughter?->mother_id === $actor->id, 403, 'Tarefa de outra família.');
        } else {
            abort_unless($task->daughter_id === $actor->id, 403, 'Você só pode concluir suas tarefas.');
        }
    }
}
