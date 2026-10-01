<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Models\TaskCompletion;
use App\Support\Weekdays;
use Carbon\Carbon;

class NotificationAndReportTest extends ApiTestCase
{
    public function test_notification_rule_can_be_read_and_updated(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();

        $this->actingAs($mother, 'sanctum')
            ->getJson('/api/v1/notification-rules')
            ->assertOk()
            ->assertJsonPath('data.frequency', 'moderada');

        $this->actingAs($mother, 'sanctum')
            ->putJson('/api/v1/notification-rules', [
                'frequency' => 'alta',
                'startTime' => '08:00',
                'endTime' => '20:00',
                'daughterReminderMinutesBefore' => 30,
            ])
            ->assertOk()
            ->assertJsonPath('data.frequency', 'alta')
            ->assertJsonPath('data.daughterReminderMinutesBefore', 30);

        $this->assertDatabaseHas('notification_rules', [
            'family_id' => $family->id,
            'frequency' => 'alta',
            'start_time' => '08:00',
        ]);
    }

    public function test_push_subscription_lifecycle(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();

        $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/push/subscriptions', [
                'subscription' => [
                    'endpoint' => 'https://push.example/abc',
                    'keys' => ['p256dh' => 'chave-publica', 'auth' => 'segredo'],
                ],
                'device' => ['platform' => 'desktop', 'standalone' => true],
            ])
            ->assertCreated();

        $this->assertDatabaseHas('push_subscriptions', ['endpoint' => 'https://push.example/abc']);

        $this->actingAs($mother, 'sanctum')
            ->deleteJson('/api/v1/push/subscriptions', ['endpoint' => 'https://push.example/abc'])
            ->assertOk();

        $this->assertDatabaseCount('push_subscriptions', 0);
    }

    public function test_vapid_public_key_endpoint_respects_configuration(): void
    {
        config(['rotina.vapid.public' => null]);

        $this->getJson('/api/v1/push/vapid-public-key')->assertStatus(503);

        config(['rotina.vapid.public' => 'chave-publica-teste']);

        $this->getJson('/api/v1/push/vapid-public-key')
            ->assertOk()
            ->assertJsonPath('publicKey', 'chave-publica-teste');
    }

    public function test_weekly_report_aggregates_completions(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $task = Task::query()->create([
            'family_id' => $family->id,
            'daughter_id' => $daughter->id,
            'title' => 'Tarefa diária',
            'category' => 'estudos',
            'weekdays' => Weekdays::all(),
            'start_time' => '09:00',
            'due_time' => '10:00',
            'points' => 10,
        ]);

        $yesterday = Carbon::yesterday();

        TaskCompletion::query()->create([
            'task_id' => $task->id,
            'daughter_id' => $daughter->id,
            'date' => $yesterday->toDateString(),
            'status' => 'concluido',
            'completed_at' => $yesterday->copy()->setTime(9, 30),
            'completed_by' => $daughter->id,
            'completed_by_daughter' => true,
            'base_points' => 10,
            'points_awarded' => 10,
        ]);

        $response = $this->actingAs($mother, 'sanctum')
            ->getJson('/api/v1/reports?period=weekly&daughter_id='.$daughter->public_id)
            ->assertOk()
            ->assertJsonStructure([
                'summary' => ['rate', 'punctuality', 'points', 'totalScheduled', 'totalCompleted'],
                'series',
                'categories',
            ]);

        $this->assertSame(1, $response->json('summary.totalCompleted'));
        $this->assertSame(10, $response->json('summary.points'));
        $this->assertSame(100, $response->json('summary.punctuality'));
    }

    public function test_mother_can_send_test_notification_to_daughter(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);

        $this->actingAs($mother, 'sanctum')
            ->postJson('/api/v1/notifications/test', [
                'title' => 'Teste',
                'message' => 'Mensagem de teste',
                'daughterId' => $daughter->public_id,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $daughter->id,
            'recipient' => 'daughter',
            'title' => 'Teste',
        ]);
    }
}
