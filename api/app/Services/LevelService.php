<?php

namespace App\Services;

final class LevelService
{
    /**
     * Curva progressiva: para sair do nível N é preciso N * pontosBase.
     * XP acumulado antes do nível L = base * L * (L - 1) / 2.
     */
    public static function levelFor(int $points, ?int $perLevel = null): int
    {
        $perLevel = self::perLevel($perLevel);
        $points = max(0, $points);

        return (int) floor((1 + sqrt(1 + (8 * $points) / $perLevel)) / 2);
    }

    /** XP acumulado necessário para alcançar o próximo nível. */
    public static function thresholdFor(int $level, ?int $perLevel = null): int
    {
        $perLevel = self::perLevel($perLevel);

        return (int) ($perLevel * $level * ($level + 1) / 2);
    }

    /** Progresso (0-100) dentro do nível atual. */
    public static function progressPercent(int $points, ?int $perLevel = null): int
    {
        $perLevel = self::perLevel($perLevel);
        $points = max(0, $points);
        $level = self::levelFor($points, $perLevel);
        $floorPoints = (int) ($perLevel * ($level - 1) * $level / 2);
        $span = max(1, $perLevel * $level);

        return (int) round((($points - $floorPoints) / $span) * 100);
    }

    private static function perLevel(?int $perLevel): int
    {
        return max(1, $perLevel ?? (int) config('rotina.points_per_level', 100));
    }
}
