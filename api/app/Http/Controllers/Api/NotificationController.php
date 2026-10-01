<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\AppNotification;
use App\Models\User;
use App\Services\NotificationService;
use App\Support\ApiPresenter;
use App\Support\FamilyContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $notifications) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = AppNotification::query()
            ->where('family_id', FamilyContext::familyId($user))
            ->where(function ($query) use ($user): void {
                $query->where('user_id', $user->id)
                    ->orWhere(function ($fallback) use ($user): void {
                        $fallback->whereNull('user_id')
                            ->where('recipient', $user->role->value);
                    });
            })
            ->latest()
            ->limit(60)
            ->get()
            ->map(fn (AppNotification $notification) => ApiPresenter::notification($notification))
            ->values();

        return response()->json(['data' => $notifications]);
    }

    public function markRead(Request $request, AppNotification $notification): JsonResponse
    {
        $user = $request->user();

        abort_unless(
            $notification->user_id === $user->id
                || ($notification->user_id === null && $notification->family_id === FamilyContext::familyId($user)),
            403,
            'Notificação não pertence a este usuário.',
        );

        $notification->forceFill(['read' => true])->save();

        return response()->json(['data' => ApiPresenter::notification($notification)]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        AppNotification::query()
            ->where('user_id', $request->user()->id)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['message' => 'Notificações marcadas como lidas.']);
    }

    public function sendTest(Request $request): JsonResponse
    {
        $actor = $request->user();

        $data = $request->validate([
            'recipient' => ['sometimes', Rule::in(['daughter', 'mother'])],
            'title' => ['required', 'string', 'max:120'],
            'message' => ['required', 'string', 'max:500'],
            'daughterId' => ['sometimes', 'string'],
        ]);

        if ($actor->isMother()) {
            $daughter = $request->filled('daughterId')
                ? FamilyContext::resolveDaughter($actor, (string) $data['daughterId'])
                : $this->firstDaughter($actor);

            $notification = $this->notifications->create(
                $daughter,
                'daughter',
                $data['title'],
                $data['message'],
                'reminder',
            );
        } else {
            // Filha dispara um teste para o próprio dispositivo.
            $notification = $this->notifications->create(
                $actor,
                'daughter',
                $data['title'],
                $data['message'],
                'reminder',
            );
        }

        return response()->json([
            'data' => ApiPresenter::notification($notification),
        ], 201);
    }

    private function firstDaughter(User $mother): User
    {
        $daughter = User::query()
            ->where('role', UserRole::Daughter)
            ->where('mother_id', $mother->id)
            ->orderBy('name')
            ->first();

        abort_unless($daughter, 404, 'Nenhuma filha cadastrada.');

        return $daughter;
    }
}
