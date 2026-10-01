<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('task_completions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained()->cascadeOnDelete();
            $table->foreignId('daughter_id')->constrained('users')->cascadeOnDelete();
            $table->date('date');
            $table->string('status', 32)->default('pendente');
            $table->timestamp('completed_at')->nullable();
            $table->foreignId('completed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('completed_by_daughter')->default(false);
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamp('late_notified_at')->nullable();
            $table->timestamps();

            $table->unique(['task_id', 'date']);
            $table->index(['daughter_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('task_completions');
    }
};
