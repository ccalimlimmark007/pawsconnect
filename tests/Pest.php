<?php

use App\Enums\Role;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

pest()->extend(Tests\TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

// ── Shared test fixture helpers ───────────────────────────────────────────────

function makeTestShelter(User $staff, string $name = 'Test Shelter'): Shelter
{
    return Shelter::create([
        'name'       => $name,
        'created_by' => $staff->id,
    ]);
}

function makeTestPet(User $staff, Shelter $shelter, array $attrs = []): Pet
{
    return Pet::create(array_merge([
        'created_by'          => $staff->id,
        'shelter_id'          => $shelter->id,
        'name'                => 'Buddy',
        'species'             => 'Dog',
        'breed'               => 'Labrador',
        'age'                 => 2,
        'age_unit'            => 'years',
        'gender'              => 'Male',
        'size'                => 'Large',
        'medical_status'      => 'Healthy',
        'adoption_fee'        => 100.00,
        'description'         => 'A friendly and energetic dog.',
        'availability_status' => true,
        'is_vetted'           => true,
    ], $attrs));
}

function makeTestPayload(Pet $pet, array $overrides = []): array
{
    return array_merge([
        'pet_id'               => (string) $pet->id,
        'home_type'            => 'house',
        'has_yard'             => true,
        'has_children'         => false,
        'has_other_pets'       => false,
        'work_hours_per_day'   => 8,
        'reason_for_adopting'  => 'I have a large yard and have wanted a dog my whole life.',
        'prior_pet_experience' => 'Grew up with pets; owned a dog for ten years.',
        'references'           => [
            ['name' => 'Jane Smith', 'relationship' => 'Friend', 'contact' => 'jane@example.com'],
        ],
    ], $overrides);
}
