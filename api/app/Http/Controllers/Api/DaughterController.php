<?php

namespace App\Http\Controllers\Api;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\AgendaService;
use App\Support\ApiPresenter;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DaughterController extends Controller
{
    public function __construct(
        private readonly AgendaService $agenda,
        private readonly AchievementService $achievements,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();

        if ($actor->isDaughter()) {
            return response()->json([
                'data' => [$this->presentWithToday($actor)],
            ]);
        }

        $daughters = User::query()
            ->where('role', UserRole::Daughter)
            ->where('mother_id', $actor->id)
            ->orderBy('name')
            ->get()
            ->map(fn (User $daughter) => $this->presentWithToday($daughter));

        return response()->json(['data' => $daughters->values()]);
    }

    public function store(Request $request): JsonResponse
    {
        $mother = $request->user();
        $familyId = FamilyContext::familyId($mother);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'school_grade' => ['nullable', 'string', 'max:80'],
            'avatar_url' => ['nullable', 'string', 'max:2048'],
        ]);

        $daughter = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => $data['password'],
            'role' => UserRole::Daughter,
            'family_id' => $familyId,
            'mother_id' => $mother->id,
            'birthdate' => $data['birthdate'] ?? null,
            'school_grade' => $data['school_grade'] ?? null,
            'avatar_url' => $data['avatar_url'] ?? null,
            'profile_status' => 'active',
        ]);

        $this->achievements->seedFor($daughter);

        return response()->json(
            ['data' => $this->presentWithToday($daughter)],
            201,
        );
    }

    public function update(Request $request, User $daughter): JsonResponse
    {
        $this->authorizeDaughter($request, $daughter);

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:120'],
            'email' => [
                'sometimes', 'email', 'max:180',
                Rule::unique('users', 'email')->ignore($daughter->id),
            ],
            'password' => ['sometimes', 'nullable', 'string', 'min:6'],
            'birthdate' => ['sometimes', 'nullable', 'date', 'before:today'],
            'school_grade' => ['sometimes', 'nullable', 'string', 'max:80'],
            'avatar_url' => ['sometimes', 'nullable', 'string', 'max:2048'],
        ]);

        if (empty($data['password'])) {
            unset($data['password']);
        }

        $daughter->fill($data)->save();

        return response()->json(['data' => $this->presentWithToday($daughter->refresh())]);
    }

    public function updateStatus(Request $request, User $daughter): JsonResponse
    {
        $this->authorizeDaughter($request, $daughter);

        $data = $request->validate([
            'status' => ['required', Rule::in(['active', 'paused'])],
        ]);

        $daughter->forceFill(['profile_status' => $data['status']])->save();

        if ($data['status'] === 'paused') {
            $daughter->tokens()->delete();
        }

        return response()->json(['data' => $this->presentWithToday($daughter->refresh())]);
    }

    private function authorizeDaughter(Request $request, User $daughter): void
    {
        $mother = $request->user();

        abort_unless(
            $daughter->isDaughter() && $daughter->mother_id === $mother->id,
            403,
            'Filha não pertence a esta família.',
        );
    }

    private function presentWithToday(User $daughter): array
    {
        $stats = $this->agenda->dayStats($daughter, Carbon::today());

        return ApiPresenter::daughter($daughter, $stats['completed'], $stats['total']);
    }
}
