<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AchievementService
{
    /**
     * Catálogo padrão criado para cada filha.
     *
     * @var array<int, array<string, mixed>>
     */
    public const DEFINITIONS = [
        [
            'code' => 'primeiro_passo',
            'title' => 'Primeiro Passo',
            'description' => 'Concluiu a primeira tarefa no Minha Rotina',
            'icon' => 'Sparkles',
            'category' => 'especial',
            'total_goal' => 1,
            'reward_points' => 20,
        ],
        [
            'code' => 'foco_total',
            'title' => 'Foco Total',
            'description' => 'Completou todas as tarefas do dia sem atrasos em 5 dias',
            'icon' => 'Target',
            'category' => 'disciplina',
            'total_goal' => 5,
            'reward_points' => 50,
        ],
        [
            'code' => 'chama_acesa',
            'title' => 'Chama Acesa (6 Dias)',
            'description' => 'Manteve a sequência de rotina por 6 dias seguidos',
            'icon' => 'Flame',
            'category' => 'streak',
            'total_goal' => 6,
            'reward_points' => 60,
        ],
        [
            'code' => 'semana_ouro',
            'title' => 'Semana de Ouro (7 Dias)',
            'description' => 'Complete 7 dias consecutivos cumprindo sua rotina diária',
            'icon' => 'Crown',
            'category' => 'streak',
            'total_goal' => 7,
            'reward_points' => 100,
        ],
        [
            'code' => 'clube_500',
            'title' => 'Clube dos 500 Pontos',
            'description' => 'Acumule 500 pontos totais em tarefas realizadas',
            'icon' => 'Trophy',
            'category' => 'pontos',
            'total_goal' => 500,
            'reward_points' => 150,
        ],
        [
            'code' => 'mestre_estudos',
            'title' => 'Mestre dos Estudos',
            'description' => 'Finalize 10 sessões de estudos com antecedência',
            'icon' => 'BookOpen',
            'category' => 'disciplina',
            'total_goal' => 10,
            'reward_points' => 80,
        ],
    ];

    public function seedFor(User $daughter): void
    {
        foreach (self::DEFINITIONS as $definition) {
            Achievement::firstOrCreate(
                ['daughter_id' => $daughter->id, 'code' => $definition['code']],
                [
                    'title' => $definition['title'],
                    'description' => $definition['description'],
                    'icon' => $definition['icon'],
                    'category' => $definition['category'],
                    'unlocked' => false,
                    'current_progress' => 0,
                    'total_goal' => $definition['total_goal'],
                    'reward_points' => $definition['reward_points'],
                ],
            );
        }
    }

    /**
     * Avalia e desbloqueia conquistas com base no histórico da filha.
     */
    public function evaluate(User $daughter): void
    {
        $achievements = Achievement::query()
            ->where('daughter_id', $daughter->id)
            ->get()
            ->keyBy('code');

        if ($achievements->isEmpty()) {
            $this->seedFor($daughter);
            $achievements = Achievement::query()
                ->where('daughter_id', $daughter->id)
                ->get()
                ->keyBy('code');
        }

        $completions = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->with('task')
            ->get();

        $streak = app(StreakService::class)->sync($daughter);

        $studyAhead = $completions
            ->filter(fn (TaskCompletion $completion) => $completion->task
                && $completion->task->category === 'estudos'
                && $completion->completed_at->format('H:i') <= substr((string) $completion->task->due_time, 0, 5))
            ->count();

        $metrics = [
            'primeiro_passo' => $completions->count(),
            'foco_total' => $this->perfectDays($daughter),
            'chama_acesa' => $streak,
            'semana_ouro' => $streak,
            'clube_500' => $daughter->total_points,
            'mestre_estudos' => $studyAhead,
        ];

        foreach ($metrics as $code => $progress) {
            $achievement = $achievements->get($code);

            if ($achievement) {
                $this->applyProgress($daughter, $achievement, $progress);
            }
        }
    }

    private function applyProgress(User $daughter, Achievement $achievement, int $progress): void
    {
        $goal = max(1, (int) $achievement->total_goal);
        $current = min($progress, $goal);
        $unlocked = $progress >= $goal;

        $achievement->current_progress = $current;

        if ($unlocked && ! $achievement->unlocked) {
            $achievement->unlocked = true;
            $achievement->unlocked_at = Carbon::now();
            $daughter->increment('total_points', (int) $achievement->reward_points);
        }

        $achievement->save();
    }

    /**
     * Quantidade de dias em que todas as tarefas programadas foram concluídas.
     */
    private function perfectDays(User $daughter): int
    {
        $tasks = Task::query()->where('daughter_id', $daughter->id)->get();

        if ($tasks->isEmpty()) {
            return 0;
        }

        $start = Carbon::today()->subDays(60);
        $completions = TaskCompletion::query()
            ->where('daughter_id', $daughter->id)
            ->whereNotNull('completed_at')
            ->whereDate('date', '>=', $start->toDateString())
            ->get()
            ->groupBy(fn (TaskCompletion $completion) => $completion->date->toDateString());

        $perfect = 0;

        for ($date = $start->copy(); $date->lessThanOrEqualTo(Carbon::today()); $date->addDay()) {
            /** @var Collection<int, Task> $scheduled */
            $scheduled = $tasks->filter(fn (Task $task) => $task->occursOn($date));

            if ($scheduled->isEmpty()) {
                continue;
            }

            $done = $completions->get($date->toDateString(), collect());

            if ($scheduled->every(fn (Task $task) => $done->contains('task_id', $task->id))) {
                $perfect++;
            }
        }

        return $perfect;
    }
}
