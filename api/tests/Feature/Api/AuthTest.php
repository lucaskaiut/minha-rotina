<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;

class AuthTest extends ApiTestCase
{
    public function test_mother_can_register_and_receives_family_and_rule(): void
    {
        $response = $this->postJson('/api/v1/auth/register', [
            'name' => 'Renata Teste',
            'email' => 'renata@teste.com',
            'password' => 'senha123',
            'password_confirmation' => 'senha123',
            'family_name' => 'Família Renata',
        ]);

        $response->assertCreated()
            ->assertJsonPath('user.role', 'mother')
            ->assertJsonPath('user.familyName', 'Família Renata')
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'token', 'tokenType']);

        $this->assertDatabaseHas('families', ['name' => 'Família Renata']);
        $this->assertDatabaseHas('notification_rules', ['enabled' => true]);

        $cookies = collect($response->headers->getCookies());
        $tokenCookie = $cookies->first(fn ($cookie) => $cookie->getName() === 'mr_token');

        $this->assertNotNull($tokenCookie, 'Cookie HttpOnly do token não foi emitido.');
        $this->assertTrue($tokenCookie->isHttpOnly());
    }

    public function test_login_returns_bearer_token_and_me_works_with_both_auth_modes(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();

        $token = $this->loginToken($mother->email);

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.email', $mother->email);

        $this->withCookie('mr_token', $token)
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('user.role', 'mother');
    }

    public function test_login_with_invalid_credentials_fails(): void
    {
        $this->createFamilyWithMother();

        $this->postJson('/api/v1/auth/login', [
            'email' => 'mae@teste.com',
            'password' => 'errada',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_paused_daughter_cannot_login(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $daughter = $this->createDaughter($family, $mother);
        $daughter->forceFill(['profile_status' => 'paused'])->save();

        $this->postJson('/api/v1/auth/login', [
            'email' => $daughter->email,
            'password' => 'senha123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_logout_revokes_current_token(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();
        $token = $this->loginToken($mother->email);

        $this->withToken($token)
            ->postJson('/api/v1/auth/logout')
            ->assertOk();

        // Simula um novo request (o guard em memória cacheia o usuário no mesmo processo de teste).
        $this->app['auth']->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();
    }

    public function test_password_can_be_reset_with_valid_token(): void
    {
        [$family, $mother] = $this->createFamilyWithMother();

        $token = Password::broker()->createToken($mother);

        $this->postJson('/api/v1/auth/reset-password', [
            'token' => $token,
            'email' => $mother->email,
            'password' => 'novaSenha123',
            'password_confirmation' => 'novaSenha123',
        ])->assertOk();

        $this->assertTrue(Hash::check('novaSenha123', $mother->refresh()->password));
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/v1/daughters')->assertUnauthorized();
        $this->getJson('/api/v1/notifications')->assertUnauthorized();
    }

    public function test_unauthenticated_response_is_json_even_without_accept_header(): void
    {
        // Clientes sem "Accept: application/json" (ex.: curl/navegador) não podem
        // receber 500 por causa do redirect para a rota "login".
        $this->get('/api/v1/daughters', ['Accept' => '*/*'])
            ->assertUnauthorized()
            ->assertHeader('Content-Type', 'application/json');
    }
}
