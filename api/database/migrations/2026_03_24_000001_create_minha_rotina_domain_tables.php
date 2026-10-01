<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('families', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('public_id')->nullable()->unique()->after('id');
            $table->string('role', 20)->default('mother')->after('password');
            $table->foreignId('family_id')->nullable()->after('role')->constrained()->nullOnDelete();
            $table->foreignId('mother_id')->nullable()->after('family_id')->constrained('users')->nullOnDelete();
            $table->string('avatar_url')->nullable();
            $table->date('birthdate')->nullable();
            $table->string('school_grade')->nullable();
            $table->string('profile_status', 20)->default('active');
            $table->unsignedInteger('streak_days')->default(0);
            $table->unsignedInteger('total_points')->default(0);
        });

        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->foreignId('family_id')->constrained()->cascadeOnDelete();
            $table->foreignId('daughter_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('category', 32);
            $table->json('weekdays');
            $table->string('start_time', 8);
            $table->string('due_time', 8);
            $table->unsignedInteger('points')->default(0);
            $table->string('status', 32)->default('pendente');
            $table->string('completed_at', 16)->nullable();
            $table->boolean('completed_by_daughter')->default(false);
            $table->timestamps();
        });

        Schema::create('achievements', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->foreignId('daughter_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('description');
            $table->string('icon', 64);
            $table->string('category', 32);
            $table->boolean('unlocked')->default(false);
            $table->timestamp('unlocked_at')->nullable();
            $table->unsignedInteger('current_progress')->default(0);
            $table->unsignedInteger('total_goal')->default(1);
            $table->unsignedInteger('reward_points')->default(0);
            $table->timestamps();
        });

        Schema::create('notification_rules', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->foreignId('family_id')->unique()->constrained()->cascadeOnDelete();
            $table->boolean('enabled')->default(true);
            $table->string('frequency', 32)->default('moderada');
            $table->string('start_time', 8)->default('07:00');
            $table->string('end_time', 8)->default('21:00');
            $table->boolean('notify_mother_on_complete')->default(true);
            $table->boolean('notify_mother_on_delay')->default(true);
            $table->unsignedSmallInteger('daughter_reminder_minutes_before')->default(15);
            $table->timestamps();
        });

        Schema::create('app_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->foreignId('family_id')->constrained()->cascadeOnDelete();
            $table->string('recipient', 16);
            $table->string('title');
            $table->text('message');
            $table->string('type', 32);
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('endpoint')->unique();
            $table->json('subscription_keys');
            $table->json('device_info')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
        Schema::dropIfExists('app_notifications');
        Schema::dropIfExists('notification_rules');
        Schema::dropIfExists('achievements');
        Schema::dropIfExists('tasks');
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('family_id');
            $table->dropConstrainedForeignId('mother_id');
            $table->dropColumn([
                'public_id',
                'role',
                'avatar_url',
                'birthdate',
                'school_grade',
                'profile_status',
                'streak_days',
                'total_points',
            ]);
        });
        Schema::dropIfExists('families');
    }
};
