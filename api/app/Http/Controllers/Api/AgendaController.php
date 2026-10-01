<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AgendaService;
use App\Support\FamilyContext;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgendaController extends Controller
{
    public function __construct(private readonly AgendaService $agenda) {}

    public function index(Request $request): JsonResponse
    {
        $data = $request->validate([
            'date' => ['sometimes', 'date_format:Y-m-d'],
            'daughterId' => ['sometimes', 'string'],
        ]);

        $actor = $request->user();
        $date = Carbon::parse($data['date'] ?? Carbon::today()->toDateString());

        if ($actor->isDaughter()) {
            $daughter = $actor;
        } else {
            abort_unless(
                isset($data['daughterId']),
                422,
                'Informe a filha para consultar a agenda.',
            );
            $daughter = FamilyContext::resolveDaughter($actor, $data['daughterId']);
        }

        $tasks = $this->agenda->tasksForDate($daughter, $date)
            ->map(fn ($task) => $this->agenda->present($task, $date));

        return response()->json([
            'date' => $date->toDateString(),
            'daughter' => $this->daughterSummary($daughter),
            'data' => $tasks,
        ]);
    }

    private function daughterSummary(User $daughter): array
    {
        return [
            'id' => $daughter->public_id,
            'name' => $daughter->name,
        ];
    }
}
