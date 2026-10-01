<?php

namespace App\Support;

use Carbon\CarbonInterface;

final class Weekdays
{
    public const CODES = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

    public const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    public static function label(CarbonInterface $date): string
    {
        return self::SHORT[$date->dayOfWeek];
    }

    public static function code(CarbonInterface $date): string
    {
        return self::CODES[$date->dayOfWeek];
    }

    public static function all(): array
    {
        return self::CODES;
    }
}
