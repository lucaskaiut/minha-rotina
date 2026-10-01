<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NotificationRule;
use App\Support\ApiPresenter;
use App\Support\FamilyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationRuleController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => ApiPresenter::notificationRule(
                $this->ruleFor(FamilyContext::familyId($request->user())),
            ),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => ['sometimes', 'boolean'],
            'frequency' => ['sometimes', Rule::in(['suave', 'moderada', 'alta'])],
            'startTime' => ['sometimes', 'date_format:H:i'],
            'endTime' => ['sometimes', 'date_format:H:i'],
            'notifyMotherOnComplete' => ['sometimes', 'boolean'],
            'notifyMotherOnDelay' => ['sometimes', 'boolean'],
            'daughterReminderMinutesBefore' => ['sometimes', 'integer', 'min:5', 'max:120'],
        ]);

        $rule = $this->ruleFor(FamilyContext::familyId($request->user()));

        $rule->fill(array_filter([
            'enabled' => $data['enabled'] ?? null,
            'frequency' => $data['frequency'] ?? null,
            'start_time' => $data['startTime'] ?? null,
            'end_time' => $data['endTime'] ?? null,
            'notify_mother_on_complete' => $data['notifyMotherOnComplete'] ?? null,
            'notify_mother_on_delay' => $data['notifyMotherOnDelay'] ?? null,
            'daughter_reminder_minutes_before' => $data['daughterReminderMinutesBefore'] ?? null,
        ], fn ($value) => $value !== null))->save();

        return response()->json(['data' => ApiPresenter::notificationRule($rule->refresh())]);
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
