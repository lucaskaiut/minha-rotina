<?php

use App\Http\Controllers\Api\AchievementController;
use App\Http\Controllers\Api\AgendaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\DaughterController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\NotificationRuleController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TaskCompletionController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/register', [AuthController::class, 'register'])->middleware('throttle:10,1');
    Route::post('auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:6,1');
    Route::post('auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:6,1');

    Route::get('push/vapid-public-key', [PushController::class, 'vapidPublicKey']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        // Leitura compartilhada (mãe e filha) — cada controlador aplica o escopo do perfil.
        Route::get('daughters', [DaughterController::class, 'index']);
        Route::get('agenda', [AgendaController::class, 'index']);
        Route::get('tasks', [TaskController::class, 'index']);
        Route::get('dashboard/summary', [DashboardController::class, 'summary']);
        Route::get('reports', [ReportController::class, 'index']);
        Route::get('achievements', [AchievementController::class, 'index']);
        Route::get('notification-rules', [NotificationRuleController::class, 'show']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead']);
        Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);
        Route::post('notifications/test', [NotificationController::class, 'sendTest']);

        Route::post('push/subscriptions', [PushController::class, 'store']);
        Route::delete('push/subscriptions', [PushController::class, 'destroy']);
        Route::put('push/preferences', [PushController::class, 'updatePreferences']);

        Route::post('tasks/{task}/completion', [TaskCompletionController::class, 'store']);
        Route::delete('tasks/{task}/completion', [TaskCompletionController::class, 'destroy']);

        Route::middleware('role:mother')->group(function (): void {
            Route::post('daughters', [DaughterController::class, 'store']);
            Route::put('daughters/{daughter}', [DaughterController::class, 'update']);
            Route::patch('daughters/{daughter}/status', [DaughterController::class, 'updateStatus']);

            Route::post('tasks', [TaskController::class, 'store']);
            Route::put('tasks/{task}', [TaskController::class, 'update']);
            Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
            Route::post('tasks/{task}/duplicate', [TaskController::class, 'duplicate']);

            Route::put('notification-rules', [NotificationRuleController::class, 'update']);
        });
    });
});
