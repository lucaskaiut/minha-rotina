<?php

namespace Tests\Feature\Api;

use App\Enums\UserRole;
use App\Models\Family;
use App\Models\NotificationRule;
use App\Models\User;
use App\Services\AchievementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

abstract class ApiTestCase extends TestCase
{
    use RefreshDatabase;

    protected function createFamilyWithMother(
        string $email = 'mae@teste.com',
        string $password = 'senha123',
    ): array {
        $family = Family::query()->create(['name' => 'Família Teste']);

        $mother = User::query()->create([
            'name' => 'Mãe Teste',
            'email' => $email,
            'password' => $password,
            'role' => UserRole::Mother,
            'family_id' => $family->id,
            'profile_status' => 'active',
        ]);

        NotificationRule::query()->create([
            'family_id' => $family->id,
            'enabled' => true,
            'frequency' => 'moderada',
            'start_time' => '00:00',
            'end_time' => '23:59',
            'notify_mother_on_complete' => true,
            'notify_mother_on_delay' => true,
            'daughter_reminder_minutes_before' => 15,
        ]);

        return [$family, $mother];
    }

    protected function createDaughter(
        Family $family,
        User $mother,
        string $email = 'filha@teste.com',
        string $password = 'senha123',
    ): User {
        $daughter = User::query()->create([
            'name' => 'Filha Teste',
            'email' => $email,
            'password' => $password,
            'role' => UserRole::Daughter,
            'family_id' => $family->id,
            'mother_id' => $mother->id,
            'profile_status' => 'active',
        ]);

        app(AchievementService::class)->seedFor($daughter);

        return $daughter;
    }

    protected function loginToken(string $email, string $password = 'senha123'): string
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => $email,
            'password' => $password,
        ]);

        $response->assertOk();

        return (string) $response->json('token');
    }
}
