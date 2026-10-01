<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Frontend / CORS
    |--------------------------------------------------------------------------
    */

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

    /*
    |--------------------------------------------------------------------------
    | Token cookie (Bearer + HttpOnly)
    |--------------------------------------------------------------------------
    |
    | A API aceita autenticação via header "Authorization: Bearer <token>".
    | Ao fazer login, o mesmo token também é gravado num cookie HttpOnly para
    | que o navegador nunca precise expor o token ao JavaScript.
    |
    */

    'token_cookie' => [
        'name' => env('AUTH_COOKIE_NAME', 'mr_token'),
        'minutes' => (int) env('AUTH_COOKIE_MINUTES', 60 * 24 * 30),
        'same_site' => env('AUTH_COOKIE_SAMESITE', 'lax'),
        'secure' => env('AUTH_COOKIE_SECURE', env('APP_ENV') === 'production'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Web Push (VAPID)
    |--------------------------------------------------------------------------
    */

    'vapid' => [
        'public' => env('VAPID_PUBLIC_KEY'),
        'private' => env('VAPID_PRIVATE_KEY'),
        'subject' => env('VAPID_SUBJECT', env('APP_URL', 'mailto:contato@minha-rotina.app')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Regras de gamificação
    |--------------------------------------------------------------------------
    */

    // Pontos base sugeridos por dificuldade (a mãe pode sobrescrever 'points').
    'difficulty_points' => [
        'easy' => 10,
        'medium' => 25,
        'hard' => 50,
        'epic' => 75,
    ],

    // Curva de nível: o passo para o nível N+1 custa (N * pontos_base).
    'points_per_level' => (int) env('POINTS_PER_LEVEL', 100),

    // Metas pessoais (ranking pessoal do requisito).
    'weekly_goal' => (int) env('WEEKLY_POINTS_GOAL', 300),
    'monthly_goal' => (int) env('MONTHLY_POINTS_GOAL', 1200),

    'bonuses' => [
        'punctuality_rate' => 0.2, // +20% ao concluir até o horário limite
        'early' => 5,              // concluir antes do horário de início
        'first_of_day' => 5,       // primeira tarefa concluída no dia
        'perfect_day' => 25,       // 100% das tarefas do dia
        'variety' => 10,           // 3+ categorias no dia
        'streak_tiers' => [
            3 => 1.25,
            7 => 1.5,
            30 => 2.0,
        ],
    ],

];
