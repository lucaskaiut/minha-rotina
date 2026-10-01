<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_completions', function (Blueprint $table) {
            $table->unsignedInteger('base_points')->default(0)->after('completed_by_daughter');
            $table->unsignedInteger('bonus_points')->default(0)->after('base_points');
            $table->unsignedInteger('points_awarded')->default(0)->after('bonus_points');
            $table->json('bonus_breakdown')->nullable()->after('points_awarded');
        });
    }

    public function down(): void
    {
        Schema::table('task_completions', function (Blueprint $table) {
            $table->dropColumn(['base_points', 'bonus_points', 'points_awarded', 'bonus_breakdown']);
        });
    }
};
