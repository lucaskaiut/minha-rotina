<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('rotina:send-reminders')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('rotina:notify-delays')->everyFiveMinutes()->withoutOverlapping();
Schedule::command('rotina:finalize-day')->dailyAt('23:55');
