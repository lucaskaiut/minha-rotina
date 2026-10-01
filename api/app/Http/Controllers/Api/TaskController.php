<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Services\AgendaService;
use App\Support\FamilyContext;
use App\Support\Weekdays;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TaskController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();
        $familyId = FamilyContext::familyId($actor);

        $query = Task::query()
            ->where('family_id', $familyId)
            ->with('daughter');

        if ($actor->isDaughter()) {
            $query->where('daughter_id', $actor->id);
        } elseif ($request->filled('daughterId')) {
            $daughter = FamilyContext::resolveDaughter($actor, (string) $request->input('daughterId'));
            $query->where('daughter_id', $daughter->id);
        }

        if ($request->filled('weekday')) {
            $weekday = (string) $request->input('weekday');
            abort_unless(in_array($weekday, Weekdays::all(), true), 422, 'Dia da semana inválido.');
            $query->whereJsonContains('weekdays', $weekday);
        }

        if ($request->filled('search')) {
            $search = '%'.str_replace('%', '', (string) $request->input('search')).'%';
            $query->where(function ($builder) use ($search): void {
                $builder->where('title', 'like', $search)
                    ->orWhere('description', 'like', $search);
            });
        }

        $today = Carbon::today();
        $tasks = $query->orderBy('start_time')->get()
            ->map(function (Task $task) use ($today) {
                // Tarefas de data única são apresentadas na própria data agendada.
                $reference = $task->task_date
                    ? Carbon::parse($task->task_date->toDateString())
                    : $today;

                return $this->agenda->present($task, $reference);
            });

        if ($request->filled('status')) {
            $status = (string) $request->input('status');
            $tasks = $tasks->filter(fn (array $task) => $task['status'] === $status)->values();
        }

        return response()->json(['data' => $tasks]);
    }

    public function store(Request $request): JsonResponse
    {
        $mother = $request->user();
        $data = $this->validated($request);

        $daughter = FamilyContext::resolveDaughter($mother, $data['daughter_id']);

        $task = Task::query()->create([
            'family_id' => FamilyContext::familyId($mother),
            'daughter_id' => $daughter->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'category' => $data['category'],
            'difficulty' => $data['difficulty'] ?? null,
            'weekdays' => $data['weekdays'],
            'task_date' => $data['task_date'],
            'start_time' => $data['start_time'],
            'due_time' => $data['due_time'],
            'points' => $data['points'] ?? 0,
            'status' => 'pendente',
        ]);

        return response()->json(
            ['data' => $this->agenda->present($task->load('daughter'), $this->referenceDate($task))],
            201,
        );
    }

    public function update(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);
        $data = $this->validated($request, partial: true, existing: $task);

        if (isset($data['daughter_id'])) {
            $daughter = FamilyContext::resolveDaughter($request->user(), $data['daughter_id']);
            $data['daughter_id'] = $daughter->id;
        }

        $task->fill($data)->save();

        return response()->json([
            'data' => $this->agenda->present($task->refresh()->load('daughter'), $this->referenceDate($task)),
        ]);
    }

    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        $task->delete();

        return response()->json(['message' => 'Tarefa removida da rotina.'], 200);
    }

    public function duplicate(Request $request, Task $task): JsonResponse
    {
        $this->authorizeTask($request, $task);

        $copy = $task->replicate(['public_id', 'status', 'completed_at', 'completed_by_daughter']);
        $copy->title = $task->title.' (Cópia)';
        $copy->status = 'pendente';
        $copy->completed_at = null;
        $copy->completed_by_daughter = false;
        $copy->save();

        return response()->json(
            ['data' => $this->agenda->present($copy->load('daughter'), $this->referenceDate($copy))],
            201,
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validated(Request $request, bool $partial = false, ?Task $existing = null): array
    {
        $required = $partial ? 'sometimes' : 'required';

        $data = $request->validate([
            'daughter_id' => [$required, 'string'],
            'title' => [$required, 'string', 'max:180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'category' => [$required, Rule::in(['estudos', 'saude', 'casa', 'lazer', 'habito'])],
            'difficulty' => ['sometimes', 'nullable', Rule::in(['easy', 'medium', 'hard', 'epic'])],
            'weekdays' => ['sometimes', 'array'],
            'weekdays.*' => [Rule::in(Weekdays::all())],
            'date' => ['sometimes', 'nullable', 'date_format:Y-m-d'],
            'start_time' => [$required, 'date_format:H:i'],
            'due_time' => [
                $required,
                'date_format:H:i',
                function (string $attribute, mixed $value, \Closure $fail) use ($request): void {
                    $start = $request->input('start_time') ?? $request->route('task')?->start_time;

                    if ($start && strtotime((string) $value) < strtotime((string) $start)) {
                        $fail('O horário limite deve ser igual ou posterior ao horário de início.');
                    }
                },
            ],
            'points' => ['sometimes', 'integer', 'min:0', 'max:1000'],
        ]);

        $date = array_key_exists('date', $data)
            ? $data['date']
            : $existing?->task_date?->toDateString();

        $weekdays = array_key_exists('weekdays', $data)
            ? array_values(array_unique($data['weekdays'] ?? []))
            : ($existing?->weekdays ?? []);

        if ($date) {
            // Tarefa de data única não repete.
            $weekdays = [];
        } elseif (empty($weekdays)) {
            throw ValidationException::withMessages([
                'weekdays' => ['Selecione ao menos um dia da semana ou escolha uma data específica.'],
            ]);
        }

        // Dificuldade define os pontos base; pontos explícitos definem a dificuldade.
        $difficultyProvided = array_key_exists('difficulty', $data) && $data['difficulty'] !== null;
        $pointsProvided = array_key_exists('points', $data);

        if ($difficultyProvided && ! $pointsProvided) {
            $data['points'] = TaskCompletion::basePointsForDifficulty($data['difficulty']) ?? 0;
        } elseif ($pointsProvided && ! $difficultyProvided) {
            $data['difficulty'] = TaskCompletion::difficultyForPoints((int) $data['points']);
        } elseif (! $difficultyProvided && ! $pointsProvided && $existing === null) {
            $data['difficulty'] = 'easy';
            $data['points'] = TaskCompletion::basePointsForDifficulty('easy') ?? 10;
        }

        unset($data['date']);
        $data['weekdays'] = $weekdays;
        $data['task_date'] = $date;

        return $data;
    }

    private function referenceDate(Task $task): Carbon
    {
        return $task->task_date
            ? Carbon::parse($task->task_date->toDateString())
            : Carbon::today();
    }

    private function authorizeTask(Request $request, Task $task): void
    {
        $actor = $request->user();

        abort_unless(
            $task->family_id === FamilyContext::familyId($actor),
            403,
            'Tarefa não pertence a esta família.',
        );

        if ($actor->isMother()) {
            abort_unless($task->daughter?->mother_id === $actor->id, 403, 'Tarefa de outra família.');
        } else {
            abort_unless($task->daughter_id === $actor->id, 403, 'Você só pode acessar suas tarefas.');
        }
    }
}
