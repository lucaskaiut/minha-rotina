<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\Family;
use App\Models\NotificationRule;
use App\Models\User;
use App\Support\ApiPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'family_name' => ['nullable', 'string', 'max:120'],
        ]);

        $mother = DB::transaction(function () use ($data): User {
            $firstName = explode(' ', trim($data['name']))[0];

            $family = Family::query()->create([
                'name' => $data['family_name'] ?? 'Família '.$firstName,
            ]);

            $mother = User::query()->create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
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

            return $mother;
        });

        return $this->authenticated($mother, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Credenciais inválidas.'],
            ]);
        }

        if ($user->profile_status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Este perfil está pausado. Fale com a mãe responsável.'],
            ]);
        }

        return $this->authenticated($user);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['user' => ApiPresenter::authUser($request->user())]);
    }

    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()
            ->json(['message' => 'Sessão encerrada.'])
            ->withCookie(cookie()->forget((string) config('rotina.token_cookie.name')));
    }

    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => ['required', 'email']]);

        Password::sendResetLink($request->only('email'));

        // Não revelamos se o e-mail existe na base.
        return response()->json([
            'message' => 'Se o e-mail existir, enviaremos as instruções de recuperação.',
        ]);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $status = Password::reset($data, function (User $user, string $password): void {
            $user->forceFill(['password' => $password])->save();
            $user->tokens()->delete();
        });

        if ($status !== Password::PasswordReset) {
            throw ValidationException::withMessages(['email' => [__($status)]]);
        }

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }

    private function authenticated(User $user, int $status = 200): JsonResponse
    {
        $token = $user->createToken('web')->plainTextToken;

        return response()
            ->json([
                'user' => ApiPresenter::authUser($user),
                'token' => $token,
                'tokenType' => 'Bearer',
            ], $status)
            ->withCookie($this->tokenCookie($token));
    }

    private function tokenCookie(string $token)
    {
        $config = config('rotina.token_cookie');

        return cookie(
            (string) $config['name'],
            $token,
            (int) $config['minutes'],
            '/',
            null,
            (bool) $config['secure'],
            true,
            false,
            (string) $config['same_site'],
        );
    }
}
