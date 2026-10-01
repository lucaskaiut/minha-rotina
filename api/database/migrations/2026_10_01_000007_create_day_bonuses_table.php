<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('day_bonuses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('daughter_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->unsignedInteger('base_points')->default(0);
            $table->unsignedInteger('perfect_bonus')->default(0);
            $table->unsignedInteger('variety_bonus')->default(0);
            $table->decimal('streak_multiplier', 4, 2)->default(1);
            $table->unsignedInteger('streak_bonus')->default(0);
            $table->unsignedInteger('total_points')->default(0);
            $table->timestamps();

            $table->unique(['daughter_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('day_bonuses');
    }
};
