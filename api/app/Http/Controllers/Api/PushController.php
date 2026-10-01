<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationRule;
use App\Models\PushSubscription;
use App\Support\ApiPresenter;
use App\Support\FamilyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PushController extends Controller
{
    public function vapidPublicKey(): JsonResponse
    {
        $publicKey = (string) config('rotina.vapid.public');

        if ($publicKey === '') {
            return response()->json([
                'message' => 'Web Push não configurado. Defina VAPID_PUBLIC_KEY e VAPID_PRIVATE_KEY.',
            ], 503);
        }

        return response()->json(['publicKey' => $publicKey]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subscription.endpoint' => ['required', 'string', 'max:1000'],
            'subscription.keys.p256dh' => ['required', 'string'],
            'subscription.keys.auth' => ['required', 'string'],
            'device' => ['sometimes', 'array'],
            'preferences' => ['sometimes', 'array'],
        ]);

        $user = $request->user();
        $endpoint = $data['subscription']['endpoint'];

        PushSubscription::query()->updateOrCreate(
            ['endpoint' => $endpoint],
            [
                'user_id' => $user->id,
                'subscription_keys' => [
                    'p256dh' => $data['subscription']['keys']['p256dh'],
                    'auth' => $data['subscription']['keys']['auth'],
                ],
                'device_info' => $data['device'] ?? null,
            ],
        );

        if ($user->isMother() && isset($data['preferences'])) {
            $this->applyPreferences($request, $data['preferences']);
        }

        return response()->json(['message' => 'Dispositivo registrado para notificações.'], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string', 'max:1000'],
        ]);

        PushSubscription::query()
            ->where('user_id', $request->user()->id)
            ->where('endpoint', $data['endpoint'])
            ->delete();

        return response()->json(['message' => 'Dispositivo removido das notificações.']);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $request->validate([
            'preferences' => ['required', 'array'],
        ]);

        $rule = $this->ruleFor(FamilyContext::familyId($request->user()));

        if ($request->user()->isMother()) {
            $rule = $this->applyPreferences($request, (array) $request->input('preferences'));
        }

        return response()->json(['data' => ApiPresenter::notificationRule($rule)]);
    }

    /**
     * @param  array<string, mixed>  $preferences
     */
    private function applyPreferences(Request $request, array $preferences): NotificationRule
    {
        $validated = validator($preferences, [
            'enabled' => ['sometimes', 'boolean'],
            'frequency' => ['sometimes', Rule::in(['suave', 'moderada', 'alta'])],
            'startTime' => ['sometimes', 'date_format:H:i'],
            'endTime' => ['sometimes', 'date_format:H:i'],
            'notifyMotherOnComplete' => ['sometimes', 'boolean'],
            'notifyMotherOnDelay' => ['sometimes', 'boolean'],
            'daughterReminderMinutesBefore' => ['sometimes', 'integer', 'min:5', 'max:120'],
        ])->validate();

        $rule = $this->ruleFor(FamilyContext::familyId($request->user()));

        $rule->fill(array_filter([
            'enabled' => $validated['enabled'] ?? null,
            'frequency' => $validated['frequency'] ?? null,
            'start_time' => $validated['startTime'] ?? null,
            'end_time' => $validated['endTime'] ?? null,
            'notify_mother_on_complete' => $validated['notifyMotherOnComplete'] ?? null,
            'notify_mother_on_delay' => $validated['notifyMotherOnDelay'] ?? null,
            'daughter_reminder_minutes_before' => $validated['daughterReminderMinutesBefore'] ?? null,
        ], fn ($value) => $value !== null))->save();

        return $rule->refresh();
    }

    private function ruleFor(int $familyId): NotificationRule
    {
        return NotificationRule::query()->firstOrCreate(
            ['family_id' => $familyId],
            [
                'enabled' => true,
                'frequency' => 'moderada',
                'start_time' => '07:00',
                'end_time' => '21:00',
                'notify_mother_on_complete' => true,
                'notify_mother_on_delay' => true,
                'daughter_reminder_minutes_before' => 15,
            ],
        );
    }
}
