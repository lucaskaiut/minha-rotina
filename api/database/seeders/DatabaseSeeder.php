<?php

namespace Database\Seeders;

use App\Models\Family;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (Family::query()->exists()) {
            $this->command?->warn('Banco já possui famílias cadastradas; seeder demo ignorado.');

            return;
        }

        $this->call(DemoDataSeeder::class);
    }
}
