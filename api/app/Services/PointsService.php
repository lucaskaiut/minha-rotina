<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;
use Carbon\CarbonInterface;

class PointsService
{
    /**
     * Calcula os pontos de uma conclusão com bônus.
     *
     * - Pontual (até o horário limite): +20% sobre os pontos base.
     * - Adiantada (antes do horário de início): bônus fixo.
     * - Primeira do dia: bônus fixo.
     * - Atrasada: 50% dos pontos base, sem bônus de pontualidade/antecipação.
     *
     * @return array{base_points:int,bonus_points:int,points_awarded:int,breakdown:array<string,mixed>}
     */
    public function awardForCompletion(
        Task $task,
        CarbonInterface $date,
        CarbonInterface $completedAt,
        bool $firstOfDay,
    ): array {
        $config = config('rotina.bonuses');

        $start = Carbon::parse($date->toDateString().' '.$task->start_time);
        $due = Carbon::parse($date->toDateString().' '.$task->due_time);

        $onTime = $completedAt->lessThanOrEqualTo($due);
        $early = $completedAt->lessThan($start);

        $base = $onTime
            ? (int) $task->points
            : (int) floor($task->points * 0.5);

        $punctuality = $onTime
            ? (int) round($task->points * (float) $config['punctuality_rate'])
            : 0;
        $earlyBonus = $early ? (int) $config['early'] : 0;
        $firstBonus = $firstOfDay ? (int) $config['first_of_day'] : 0;

        $bonus = $punctuality + $earlyBonus + $firstBonus;

        return [
            'base_points' => $base,
            'bonus_points' => $bonus,
            'points_awarded' => $base + $bonus,
            'breakdown' => [
                'punctuality' => $punctuality,
                'early' => $earlyBonus,
                'first_of_day' => $firstBonus,
                'late' => ! $onTime,
            ],
        ];
    }
}
