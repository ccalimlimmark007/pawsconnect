<?php

use App\Enums\Role;
use App\Models\AdoptionApplication;
use App\Models\User;
use App\Notifications\ApplicationSubmitted;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

    $this->staff   = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->shelter = makeTestShelter($this->staff);
    $this->pet     = makeTestPet($this->staff, $this->shelter);
    $this->adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->payload = makeTestPayload($this->pet);
});

// ── Role / access guards ──────────────────────────────────────────────────────

it('redirects unauthenticated users to the login page', function () {
    $this->post(route('pets.apply.submit'), $this->payload)
        ->assertRedirect(route('login'));
});

it('blocks shelter staff from submitting adoption applications', function () {
    $this->actingAs($this->staff)
        ->post(route('pets.apply.submit'), $this->payload)
        ->assertForbidden();
});

it('blocks admins from submitting adoption applications', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $this->actingAs($admin)
        ->post(route('pets.apply.submit'), $this->payload)
        ->assertForbidden();
});

// ── Validation ────────────────────────────────────────────────────────────────

it('fails validation when required fields are missing', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), [])
        ->assertSessionHasErrors(['pet_id', 'home_type', 'has_yard', 'has_children', 'has_other_pets', 'reason_for_adopting']);
});

it('rejects a reason_for_adopting that is shorter than 20 characters', function () {
    $payload = makeTestPayload($this->pet, ['reason_for_adopting' => 'Too short.']);

    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $payload)
        ->assertSessionHasErrors('reason_for_adopting');
});

it('requires other_pets_description when has_other_pets is true', function () {
    $payload = makeTestPayload($this->pet, [
        'has_other_pets'          => true,
        'other_pets_description'  => null,
    ]);

    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $payload)
        ->assertSessionHasErrors('other_pets_description');
});

// ── Successful submission ─────────────────────────────────────────────────────

it('creates a pending application on successful submission', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload)
        ->assertRedirect(route('pets.index'));

    expect(
        AdoptionApplication::where('user_id', $this->adopter->id)
            ->where('pet_id', (string) $this->pet->id)
            ->where('status', 'pending')
            ->exists()
    )->toBeTrue();
});

it('records started_at on the new application', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $app = AdoptionApplication::where('user_id', $this->adopter->id)->firstOrFail();
    expect($app->started_at)->not->toBeNull();
});

it('persists all questionnaire fields', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    $app = AdoptionApplication::where('user_id', $this->adopter->id)->firstOrFail();
    expect($app->home_type)->toBe('house')
        ->and($app->has_yard)->toBeTrue()
        ->and($app->has_children)->toBeFalse()
        ->and($app->work_hours_per_day)->toBe(8);
});

it('notifies shelter staff when a new application is submitted', function () {
    $this->actingAs($this->adopter)
        ->post(route('pets.apply.submit'), $this->payload);

    Notification::assertSentTo($this->staff, ApplicationSubmitted::class);
});
