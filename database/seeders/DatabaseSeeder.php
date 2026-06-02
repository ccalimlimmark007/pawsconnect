<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@pawsconnect.com'],
            ['name' => 'Admin User', 'password' => bcrypt('password'), 'role' => Role::Admin]
        );

        User::firstOrCreate(
            ['email' => 'shelter@pawsconnect.com'],
            ['name' => 'Shelter Staff', 'password' => bcrypt('password'), 'role' => Role::ShelterStaff]
        );

        User::firstOrCreate(
            ['email' => 'test@example.com'],
            ['name' => 'Test Adopter', 'password' => bcrypt('password'), 'role' => Role::Adopter]
        );

        $this->call(PetSeeder::class);
    }
}
