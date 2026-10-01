<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Support\Weekdays;
use Carbon\Carbon;

class GamificationTest extends ApiTestCase
{
    public function test_difficulty_defines_base_points(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Projeto de ciências',
                'category' => 'estudos',
                'difficulty' => 'hard',
                'weekdays' => Weekdays::all(),
                'start_time' => '10:00',
                'due_time' => '11:00',
            ])
            ->assertCreated()
            ->assertJsonPath('data.difficulty', 'hard')
            ->assertJsonPath('data.points', 50);

        $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Regar as plantas',
                'category' => 'casa',
                'weekdays' => Weekdays::all(),
                'start_time' => '08:00',
                'due_time' => '09:00',
                'points' => 25,
            ])
            ->assertCreated()
            ->assertJsonPath('data.difficulty', 'medium')
            ->assertJsonPath('data.points', 25);
    }

    public function test_late_completion_earns_half_points_without_punctuality(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $task = Task::query()->create([
            'family_id' => $family->id,
            'daughter_id' => $daughter->id,
            'title' => 'Tarefa de ontem',
            'category' => 'casa',
            'difficulty' => 'medium',
            'weekdays' => Weekdays::all(),
            'start_time' => '09:00',
            'due_time' => '10:00',
            'points' => 30,
        ]);

        $this->actingAs($mother, 'sanctum')
            ->postJson("/api/v1/tasks/{$task->public_id}/completion", [
                'date' => Carbon::yesterday()->toDateString(),
            ])
            ->assertOk()
            ->assertJsonPath('points.base', 15)
            ->assertJsonPath('points.bonus', 5) // apenas "primeira do dia"
            ->assertJsonPath('points.awarded', 20)
            ->assertJsonPath('points.breakdown.late', true);
    }

    public function test_day_close_bonus_for_perfect_day_with_variety(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $categories = ['casa', 'estudos', 'saude'];

        foreach ($categories as $index => $category) {
            $task = Task::query()->create([
                'family_id' => $family->id,
                'daughter_id' => $daughter->id,
                'title' => "Tarefa {$category}",
                'category' => $category,
                'difficulty' => 'easy',
                'weekdays' => Weekdays::all(),
                'start_time' => '00:00',
                'due_time' => '23:59',
                'points' => 10,
            ]);

            $this->actingAs($daughter, 'sanctum')
                ->postJson("/api/v1/tasks/{$task->public_id}/completion")
                ->assertOk();
        }

        // 10 + 2 de pontualidade cada (+5 na primeira) = 41 pontos de tarefas.
        $this->artisan('rotina:finalize-day')->assertSuccessful();

        // Fechamento: dia perfeito (+25) + variedade de 3 categorias (+10).
        $this->assertDatabaseHas('day_bonuses', [
            'daughter_id' => $daughter->id,
            'date' => Carbon::today()->toDateString(),
            'perfect_bonus' => 25,
            'variety_bonus' => 10,
            'total_points' => 35,
            'streak_multiplier' => 1,
        ]);

        // 41 das conclusões + 35 do fechamento + 20 da conquista "Primeiro Passo".
        $this->assertSame(96, $daughter->refresh()->total_points);
    }

    public function test_level_curve_and_goals_summary(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);
        $daughter->forceFill(['total_points' => 250])->save();

        $response = $this->actingAs($mother, 'sanctum')
            ->getJson('/api/v1/achievements?daughter_id='.$daughter->public_id)
            ->assertOk();

        // Curva: nível 2 começa em 100 e o 3 em 300 → 250 = 75% do caminho.
        $response
            ->assertJsonPath('points.level', 2)
            ->assertJsonPath('points.nextLevelPoints', 300)
            ->assertJsonPath('points.levelProgress', 75)
            ->assertJsonPath('points.weekly.goal', 300)
            ->assertJsonPath('points.monthly.goal', 1200);
    }
}
