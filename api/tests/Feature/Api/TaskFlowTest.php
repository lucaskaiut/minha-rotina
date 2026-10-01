<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Support\Weekdays;
use Carbon\Carbon;

class TaskFlowTest extends ApiTestCase
{
    public function test_mother_creates_task_and_daughter_completes_it(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $weekday = Weekdays::code(Carbon::today());

        $created = $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Arrumar a cama',
                'description' => 'Esticar o lençol',
                'category' => 'casa',
                'weekdays' => [$weekday],
                'start_time' => '00:00',
                'due_time' => '23:59',
                'points' => 15,
            ])
            ->assertCreated()
            ->assertJsonPath('data.title', 'Arrumar a cama')
            ->assertJsonPath('data.difficulty', 'easy');

        $taskId = (string) $created->json('data.id');

        $agenda = $this->actingAs($daughter, 'sanctum')
            ->getJson('/api/v1/agenda')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->assertNotSame('concluido', $agenda->json('data.0.status'));

        $this->actingAs($daughter, 'sanctum')
            ->postJson("/api/v1/tasks/{$taskId}/completion")
            ->assertOk()
            ->assertJsonPath('data.status', 'concluido')
            ->assertJsonPath('data.completedByDaughter', true)
            ->assertJsonPath('points.base', 15)
            ->assertJsonPath('points.bonus', 8) // +3 pontualidade +5 primeira do dia
            ->assertJsonPath('points.awarded', 23);

        // 23 pontos (15 + bônus) + 25 de dia perfeito (única tarefa do dia)
        // + 20 da conquista "Primeiro Passo".
        $this->assertSame(68, $daughter->refresh()->total_points);

        // RN003: não pode concluir duas vezes no mesmo dia.
        $this->actingAs($daughter, 'sanctum')
            ->postJson("/api/v1/tasks/{$taskId}/completion")
            ->assertStatus(409);

        // Mãe é notificada da conclusão.
        $this->actingAs($mother, 'sanctum')
            ->getJson('/api/v1/notifications')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.recipient', 'mother');

        // Dashboard reflete a conclusão.
        $this->actingAs($mother, 'sanctum')
            ->getJson('/api/v1/dashboard/summary?daughter_id='.$daughter->public_id)
            ->assertOk()
            ->assertJsonPath('totals.completed', 1)
            ->assertJsonPath('totals.completionRate', 100)
            ->assertJsonPath('pointsToday', 48); // 23 da conclusão + 25 de dia perfeito
    }

    public function test_daughter_can_undo_completion_and_points_are_removed(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $task = Task::query()->create([
            'family_id' => $family->id,
            'daughter_id' => $daughter->id,
            'title' => 'Lição',
            'category' => 'estudos',
            'weekdays' => Weekdays::all(),
            'start_time' => '00:00',
            'due_time' => '23:59',
            'points' => 30,
        ]);

        $this->actingAs($daughter, 'sanctum')
            ->postJson("/api/v1/tasks/{$task->public_id}/completion")
            ->assertOk();

        // 30 + 6 de pontualidade + 5 primeira do dia + 25 de dia perfeito
        // + 20 da conquista "Primeiro Passo".
        $this->assertSame(86, $daughter->refresh()->total_points);

        $this->actingAs($daughter, 'sanctum')
            ->deleteJson("/api/v1/tasks/{$task->public_id}/completion")
            ->assertOk()
            ->assertJsonPath('data.completedAt', null);

        // Pontos da tarefa e bônus do dia removidos; o bônus de conquista permanece.
        $this->assertSame(20, $daughter->refresh()->total_points);
    }

    public function test_daughter_cannot_manage_tasks(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $this->actingAs($daughter, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Tarefa proibida',
                'category' => 'casa',
                'weekdays' => ['seg'],
                'start_time' => '10:00',
                'due_time' => '11:00',
            ])
            ->assertForbidden();

        $this->actingAs($daughter, 'sanctum')
            ->postJson('/api/v1/daughters', [
                'name' => 'Outra filha',
                'email' => 'outra@teste.com',
                'password' => 'senha123',
            ])
            ->assertForbidden();
    }

    public function test_mother_can_manage_daughters(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();

        $created = $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/daughters', [
                'name' => 'Beatriz',
                'email' => 'beatriz@teste.com',
                'password' => 'senha123',
                'birthdate' => '2014-03-10',
                'school_grade' => '7º Ano',
            ])
            ->assertCreated()
            ->assertJsonPath('data.name', 'Beatriz');

        $daughterId = (string) $created->json('data.id');

        $this->actingAs($mother, 'sanctum')
            ->patchJson("/api/v1/daughters/{$daughterId}/status", ['status' => 'paused'])
            ->assertOk()
            ->assertJsonPath('data.status', 'paused');

        $this->actingAs($mother, 'sanctum')
            ->putJson("/api/v1/daughters/{$daughterId}", ['name' => 'Beatriz Lima'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Beatriz Lima');

        // Conquistas padrão foram criadas para a nova filha.
        $this->assertDatabaseCount('achievements', 6);
    }

    public function test_one_time_task_only_appears_on_scheduled_date(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $tomorrow = Carbon::tomorrow();

        $created = $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Entregar trabalho de artes',
                'category' => 'estudos',
                'weekdays' => [],
                'date' => $tomorrow->toDateString(),
                'start_time' => '07:00',
                'due_time' => '08:00',
                'points' => 25,
            ])
            ->assertCreated()
            ->assertJsonPath('data.repeat', 'once')
            ->assertJsonPath('data.scheduledDate', $tomorrow->toDateString())
            ->assertJsonPath('data.weekdays', []);

        $taskId = (string) $created->json('data.id');

        // Não aparece na agenda de hoje.
        $this->actingAs($daughter, 'sanctum')
            ->getJson('/api/v1/agenda')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        // Aparece na agenda da data agendada.
        $this->actingAs($daughter, 'sanctum')
            ->getJson('/api/v1/agenda?date='.$tomorrow->toDateString())
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Entregar trabalho de artes');

        // Não pode ser concluída fora da data agendada.
        $this->actingAs($daughter, 'sanctum')
            ->postJson("/api/v1/tasks/{$taskId}/completion", [
                'date' => Carbon::today()->toDateString(),
            ])
            ->assertUnprocessable();

        $this->actingAs($daughter, 'sanctum')
            ->postJson("/api/v1/tasks/{$taskId}/completion", [
                'date' => $tomorrow->toDateString(),
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'concluido');
    }

    public function test_task_requires_weekdays_or_specific_date(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/tasks', [
                'daughter_id' => $daughter->public_id,
                'title' => 'Tarefa sem agenda',
                'category' => 'casa',
                'weekdays' => [],
                'start_time' => '10:00',
                'due_time' => '11:00',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('weekdays');
    }

    public function test_weekly_task_can_be_converted_to_one_time(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $task = Task::query()->create([
            'family_id' => $family->id,
            'daughter_id' => $daughter->id,
            'title' => 'Leitura',
            'category' => 'habito',
            'weekdays' => Weekdays::all(),
            'start_time' => '18:00',
            'due_time' => '19:00',
            'points' => 20,
        ]);

        $date = Carbon::tomorrow()->toDateString();

        $this->actingAs($mother, 'sanctum')
            ->putJson("/api/v1/tasks/{$task->public_id}", [
                'daughter_id' => $daughter->public_id,
                'title' => $task->title,
                'category' => $task->category,
                'weekdays' => [],
                'date' => $date,
                'start_time' => '18:00',
                'due_time' => '19:00',
                'points' => 20,
            ])
            ->assertOk()
            ->assertJsonPath('data.repeat', 'once')
            ->assertJsonPath('data.scheduledDate', $date)
            ->assertJsonPath('data.weekdays', []);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'task_date' => $date,
        ]);
    }

    public function test_task_can_be_duplicated(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $task = Task::query()->create([
            'family_id' => $family->id,
            'daughter_id' => $daughter->id,
            'title' => 'Leitura',
            'category' => 'habito',
            'weekdays' => Weekdays::all(),
            'start_time' => '18:00',
            'due_time' => '19:00',
            'points' => 20,
        ]);

        $this->actingAs($mother, 'sanctum')
            ->postJson("/api/v1/tasks/{$task->public_id}/duplicate")
            ->assertCreated()
            ->assertJsonPath('data.title', 'Leitura (Cópia)');

        $this->assertDatabaseCount('tasks', 2);
    }
}
