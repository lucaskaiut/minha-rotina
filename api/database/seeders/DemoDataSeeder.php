<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Family;
use App\Models\NotificationRule;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\DayBonusService;
use App\Services\StreakService;
use App\Support\Weekdays;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function (): void {
            $family = Family::query()->create(['name' => 'Família Oliveira']);

            $mother = User::query()->create([
                'name' => 'Renata Oliveira',
                'email' => 'renata@familia.com',
                'password' => 'rotina123',
                'role' => UserRole::Mother,
                'family_id' => $family->id,
                'profile_status' => 'active',
            ]);

            NotificationRule::query()->create([
                'family_id' => $family->id,
                'enabled' => true,
                'frequency' => 'moderada',
                'start_time' => '07:00',
                'end_time' => '21:00',
                'notify_mother_on_complete' => true,
                'notify_mother_on_delay' => true,
                'daughter_reminder_minutes_before' => 15,
            ]);

            $laura = $this->createDaughter($family, $mother, [
                'name' => 'Laura Oliveira',
                'email' => 'laura@familia.com',
                'birthdate' => '2013-05-14',
                'school_grade' => '8º Ano Fundamental',
            ]);

            $sophia = $this->createDaughter($family, $mother, [
                'name' => 'Sophia Oliveira',
                'email' => 'sophia@familia.com',
                'birthdate' => '2017-08-22',
                'school_grade' => '4º Ano Fundamental',
            ]);

            $allWeek = Weekdays::all();
            $weekdays = ['seg', 'ter', 'qua', 'qui', 'sex'];

            $lauraTasks = [
                ['title' => 'Arrumar a cama e organizar o quarto', 'description' => 'Deixar os lençóis esticados e guardar livros na prateleira', 'category' => 'casa', 'difficulty' => 'easy', 'weekdays' => $allWeek, 'start_time' => '07:15', 'due_time' => '07:45', 'points' => 10],
                ['title' => 'Tomar café reforçado & vitaminas', 'description' => 'Comer fruta e tomar vitamina D prescrita pela pediatra', 'category' => 'saude', 'difficulty' => 'easy', 'weekdays' => $weekdays, 'start_time' => '07:45', 'due_time' => '08:15', 'points' => 10],
                ['title' => 'Revisar conteúdo de Matemática e Português', 'description' => 'Exercícios das páginas 42 a 45 para a prova de sexta', 'category' => 'estudos', 'difficulty' => 'hard', 'weekdays' => ['seg', 'ter', 'qua', 'qui'], 'start_time' => '14:30', 'due_time' => '15:30', 'points' => 50],
                ['title' => 'Leitura de 20 páginas do livro do mês', 'description' => 'Livro: O Pequeno Príncipe / Percy Jackson', 'category' => 'habito', 'difficulty' => 'medium', 'weekdays' => $allWeek, 'start_time' => '16:30', 'due_time' => '17:15', 'points' => 25],
                ['title' => 'Preparar mochila e uniforme para amanhã', 'description' => 'Conferir cronograma de aulas e estojo completo', 'category' => 'casa', 'difficulty' => 'easy', 'weekdays' => ['seg', 'ter', 'qua', 'qui', 'dom'], 'start_time' => '20:00', 'due_time' => '20:45', 'points' => 10],
                ['title' => 'Levar trabalho de artes para a escola', 'description' => 'Tarefa pontual: entregar a maquete do sistema solar', 'category' => 'estudos', 'difficulty' => 'hard', 'weekdays' => [], 'task_date' => Carbon::tomorrow()->toDateString(), 'start_time' => '07:00', 'due_time' => '07:40', 'points' => 50],
            ];

            $sophiaTasks = [
                ['title' => 'Escovar os dentes e lavar o rosto', 'description' => 'Escovação de 2 minutos e passar fio dental', 'category' => 'saude', 'difficulty' => 'easy', 'weekdays' => $allWeek, 'start_time' => '07:30', 'due_time' => '08:00', 'points' => 10],
                ['title' => 'Lição de casa de Ciências', 'description' => 'Folha de atividades sobre o ciclo da água', 'category' => 'estudos', 'difficulty' => 'medium', 'weekdays' => ['seg', 'qua', 'qui'], 'start_time' => '15:00', 'due_time' => '15:45', 'points' => 25],
                ['title' => 'Guardar brinquedos na caixa organizadora', 'description' => 'Tirar peças de lego do chão e organizar estante', 'category' => 'casa', 'difficulty' => 'easy', 'weekdays' => $allWeek, 'start_time' => '17:30', 'due_time' => '18:15', 'points' => 10],
                ['title' => 'Hora do banho & pijama', 'description' => 'Separar toalha limpa e colocar roupa suja no cesto', 'category' => 'saude', 'difficulty' => 'easy', 'weekdays' => $allWeek, 'start_time' => '19:30', 'due_time' => '20:15', 'points' => 10],
            ];

            $lauraCreated = $this->createTasks($family, $laura, $lauraTasks);
            $sophiaCreated = $this->createTasks($family, $sophia, $sophiaTasks);

            $this->seedHistory($laura, $lauraCreated, [100, 80, 100, 75, 100, 100, 60]);
            $this->seedHistory($sophia, $sophiaCreated, [100, 100, 75, 100, 80, 100, 50]);

            // Bônus de fechamento (dia perfeito, variedade e sequência) para cada dia do histórico.
            foreach ([$laura, $sophia] as $daughter) {
                for ($i = 6; $i >= 0; $i--) {
                    app(DayBonusService::class)->recalculate($daughter, Carbon::today()->subDays($i));
                }
            }

            app(StreakService::class)->sync($laura);
            app(StreakService::class)->sync($sophia);
            app(AchievementService::class)->evaluate($laura);
            app(AchievementService::class)->evaluate($sophia);
        });
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function createDaughter(Family $family, User $mother, array $attributes): User
    {
        $daughter = User::query()->create([
            ...$attributes,
            'password' => 'rotina123',
            'role' => UserRole::Daughter,
            'family_id' => $family->id,
            'mother_id' => $mother->id,
            'profile_status' => 'active',
        ]);

        app(AchievementService::class)->seedFor($daughter);

        return $daughter;
    }

    /**
     * @param  array<int, array<string, mixed>>  $definitions
     * @return array<int, Task>
     */
    private function createTasks(Family $family, User $daughter, array $definitions): array
    {
        $tasks = [];

        foreach ($definitions as $definition) {
            $tasks[] = Task::query()->create([
                ...$definition,
                'family_id' => $family->id,
                'daughter_id' => $daughter->id,
                'status' => 'pendente',
            ]);
        }

        return $tasks;
    }

    /**
     * Cria o histórico dos últimos 7 dias (do mais antigo ao dia de hoje).
     *
     * @param  array<int, Task>  $tasks
     * @param  array<int, int>  $rates
     */
    private function seedHistory(User $daughter, array $tasks, array $rates): void
    {
        $today = Carbon::today();

        foreach ($rates as $index => $rate) {
            $date = $today->copy()->subDays(6 - $index);

            $scheduled = collect($tasks)
                ->filter(fn (Task $task) => $task->occursOn($date))
                ->values();

            if ($scheduled->isEmpty()) {
                continue;
            }

            $toComplete = (int) ceil($scheduled->count() * $rate / 100);

            foreach ($scheduled->take($toComplete) as $task) {
                $completedAt = Carbon::parse(
                    $date->toDateString().' '.$task->start_time,
                )->addMinutes(5);

                TaskCompletion::query()->create([
                    'task_id' => $task->id,
                    'daughter_id' => $daughter->id,
                    'date' => $date->toDateString(),
                    'status' => 'concluido',
                    'completed_at' => $completedAt,
                    'completed_by' => $daughter->id,
                    'completed_by_daughter' => true,
                    'base_points' => $task->points,
                    'bonus_points' => 0,
                    'points_awarded' => $task->points,
                ]);

                $daughter->increment('total_points', $task->points);
            }
        }
    }
}
