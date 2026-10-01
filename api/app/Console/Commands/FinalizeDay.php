<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use App\Services\AchievementService;
use App\Services\DayBonusService;
use App\Services\StreakService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class FinalizeDay extends Command
{
    protected $signature = 'rotina:finalize-day {--date= : Data de referência (Y-m-d)}';

    protected $description = 'Recalcula sequências e conquistas ao final do dia';

    public function handle(
        StreakService $streaks,
        AchievementService $achievements,
        DayBonusService $dayBonuses,
    ): int {
        $date = Carbon::parse($this->option('date') ?? Carbon::today()->toDateString());

        User::query()
            ->where('role', UserRole::Daughter)
            ->where('profile_status', 'active')
            ->each(function (User $daughter) use ($streaks, $achievements, $dayBonuses, $date): void {
                $streaks->sync($daughter, $date);
                $achievements->evaluate($daughter);
                $dayBonuses->recalculate($daughter, $date);
            });

        $this->info("Dia {$date->toDateString()} finalizado: sequências e conquistas atualizadas.");

        return self::SUCCESS;
    }
}
