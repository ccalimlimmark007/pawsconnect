<?php

use App\Enums\Role;
use App\Models\AdoptionApplication;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Support\Facades\Notification;

// ─── Shared setup ────────────────────────────────────────────────────────────

beforeEach(function () {
    Notification::fake();

    $staff = User::factory()->create(['role' => Role::ShelterStaff]);

    $shelter = Shelter::create([
        'name'       => 'Happy Paws Shelter',
        'created_by' => $staff->id,
    ]);

    $this->pet = Pet::create([
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
        'adoption_fee'        => 100,
        'description'         => 'A friendly and energetic dog.',
        'availability_status' => true,
        'is_vetted'           => true,
    ]);

    $this->adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->admin   = User::factory()->create(['role' => Role::Admin]);

    $this->payload = [
        'pet_id'               => (string) $this->pet->id,
        'home_type'            => 'house',
        'has_yard'             => true,
        'has_children'         => false,
        'has_other_pets'       => false,
        'work_hours_per_day'   => 8,
        'reason_for_adopting'  => 'I have a large yard and have wanted a dog my whole life.',
        'prior_pet_experience' => 'Grew up with pets; owned a Beagle for 10 years.',
        'references'           => [
            ['name' => 'Jane Smith', 'relationship' => 'Friend', 'contact' => 'jane@example.com'],
        ],
    ];
});

// ─── Tests ───────────────────────────────────────────────────────────────────

it('allows an adopter to submit a first-time application', function () {
    $response = $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $response->assertRedirect(route('pets.index'));

    expect(
        AdoptionApplication::where('user_id', $this->adopter->id)
            ->where('pet_id', (string) $this->pet->id)
            ->where('status', 'pending')
            ->exists()
    )->toBeTrue();
});

it('sets dedup_key to pet_id on a successful submission', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $app = AdoptionApplication::where('user_id', $this->adopter->id)->first();

    expect($app->dedup_key)->toBe((string) $this->pet->id);
});

it('blocks a second submission when the first application is still pending', function () {
    // First submission succeeds
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    // Second submission must fail
    $response = $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $response->assertSessionHasErrors('pet_id');

    // Only one application record should exist
    expect(
        AdoptionApplication::where('user_id', $this->adopter->id)
            ->where('pet_id', (string) $this->pet->id)
            ->count()
    )->toBe(1);
});

it('blocks re-submission when the application has been approved', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $application = AdoptionApplication::where('user_id', $this->adopter->id)->first();

    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $application->id), [
            'status' => 'approved',
        ]);

    $response = $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $response->assertSessionHasErrors('pet_id');
});

it('sets dedup_key to null when an application is rejected', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $application = AdoptionApplication::where('user_id', $this->adopter->id)->first();

    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $application->id), [
            'status'          => 'rejected',
            'rejected_reason' => 'Not a suitable match at this time.',
        ]);

    expect($application->fresh()->dedup_key)->toBeNull();
});

it('allows re-application after a rejection', function () {
    // Submit and get rejected
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $application = AdoptionApplication::where('user_id', $this->adopter->id)->first();

    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $application->id), [
            'status'          => 'rejected',
            'rejected_reason' => 'Not a suitable match at this time.',
        ]);

    // Re-apply after rejection — must succeed
    $response = $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $response->assertRedirect(route('pets.index'));

    // A new pending application should exist alongside the rejected one
    expect(
        AdoptionApplication::where('user_id', $this->adopter->id)
            ->where('pet_id', (string) $this->pet->id)
            ->where('status', 'pending')
            ->exists()
    )->toBeTrue();

    expect(
        AdoptionApplication::where('user_id', $this->adopter->id)
            ->where('pet_id', (string) $this->pet->id)
            ->where('status', 'rejected')
            ->exists()
    )->toBeTrue();
});

it('does not trigger a unique constraint violation on re-application after rejection', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $application = AdoptionApplication::where('user_id', $this->adopter->id)->first();

    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $application->id), [
            'status'          => 'rejected',
            'rejected_reason' => 'Test rejection.',
        ]);

    // Re-apply — the DB unique on (user_id, dedup_key) must not block this
    expect(fn () =>
        $this->actingAs($this->adopter)
            ->post(route('pets.apply.submit'), $this->payload)
    )->not->toThrow(\Illuminate\Database\UniqueConstraintViolationException::class);
});
