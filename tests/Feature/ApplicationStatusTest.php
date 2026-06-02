<?php

use App\Enums\Role;
use App\Models\AdoptionApplication;
use App\Models\User;
use App\Notifications\ApplicationApproved;
use App\Notifications\ApplicationRejected;
use Illuminate\Support\Facades\Notification;

beforeEach(function () {
    Notification::fake();

    $this->staff   = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->shelter = makeTestShelter($this->staff);
    $this->pet     = makeTestPet($this->staff, $this->shelter);
    $this->adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->admin   = User::factory()->create(['role' => Role::Admin]);

    // Create a pending application to work with
    $this->application = AdoptionApplication::create([
        'user_id'             => $this->adopter->id,
        'pet_id'              => (string) $this->pet->id,
        'dedup_key'           => (string) $this->pet->id,
        'status'              => 'pending',
        'started_at'          => now(),
        'home_type'           => 'house',
        'has_yard'            => true,
        'has_children'        => false,
        'has_other_pets'      => false,
        'work_hours_per_day'  => 8,
        'reason_for_adopting' => 'I have always loved dogs.',
        'references'          => [['name' => 'Jane', 'relationship' => 'Friend', 'contact' => 'jane@example.com']],
    ]);
});

// ── Admin: approve / reject ───────────────────────────────────────────────────

it('allows an admin to approve an application', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved'])
        ->assertRedirect();

    expect($this->application->fresh()->status)->toBe('approved');
});

it('allows an admin to reject an application with a reason', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), [
            'status'          => 'rejected',
            'rejected_reason' => 'Not a suitable match at this time.',
        ])
        ->assertRedirect();

    $fresh = $this->application->fresh();
    expect($fresh->status)->toBe('rejected')
        ->and($fresh->rejected_reason)->toBe('Not a suitable match at this time.');
});

it('sets reviewed_by and reviewed_at when approving', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved']);

    $fresh = $this->application->fresh();
    expect($fresh->reviewed_by)->toBe($this->admin->id)
        ->and($fresh->reviewed_at)->not->toBeNull();
});

it('saves optional review notes', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), [
            'status' => 'approved',
            'notes'  => 'Great applicant, home visit scheduled.',
        ]);

    expect($this->application->fresh()->notes)->toBe('Great applicant, home visit scheduled.');
});

// ── Shelter staff authorization ───────────────────────────────────────────────

it('allows shelter staff to update status for their own shelter\'s applications', function () {
    $this->actingAs($this->staff)
        ->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved'])
        ->assertRedirect();

    expect($this->application->fresh()->status)->toBe('approved');
});

it('forbids shelter staff from updating applications for another shelter\'s pets', function () {
    $otherStaff   = User::factory()->create(['role' => Role::ShelterStaff]);
    $otherShelter = makeTestShelter($otherStaff, 'Other Shelter');
    $otherPet     = makeTestPet($otherStaff, $otherShelter);

    $otherApp = AdoptionApplication::create([
        'user_id'             => $this->adopter->id,
        'pet_id'              => (string) $otherPet->id,
        'dedup_key'           => (string) $otherPet->id,
        'status'              => 'pending',
        'started_at'          => now(),
        'home_type'           => 'house',
        'has_yard'            => false,
        'has_children'        => false,
        'has_other_pets'      => false,
        'work_hours_per_day'  => 8,
        'reason_for_adopting' => 'I would love to adopt this pet.',
        'references'          => [['name' => 'Bob', 'relationship' => 'Colleague', 'contact' => 'bob@example.com']],
    ]);

    $this->actingAs($this->staff)
        ->patch(route('admin.applications.update', $otherApp->id), ['status' => 'approved'])
        ->assertForbidden();
});

// ── Role guards ───────────────────────────────────────────────────────────────

it('forbids adopters from updating application status', function () {
    $this->actingAs($this->adopter)
        ->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved'])
        ->assertForbidden();
});

it('redirects unauthenticated users when updating status', function () {
    $this->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved'])
        ->assertRedirect(route('login'));
});

// ── Notifications ─────────────────────────────────────────────────────────────

it('sends an approval notification to the applicant', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), ['status' => 'approved']);

    Notification::assertSentTo($this->adopter, ApplicationApproved::class);
});

it('sends a rejection notification to the applicant', function () {
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), [
            'status'          => 'rejected',
            'rejected_reason' => 'Not a suitable match.',
        ]);

    Notification::assertSentTo($this->adopter, ApplicationRejected::class);
});

it('does not send a notification when status does not change', function () {
    // Application is already pending; update notes without changing status
    $this->actingAs($this->admin)
        ->patch(route('admin.applications.update', $this->application->id), [
            'status' => 'pending',
            'notes'  => 'Following up.',
        ]);

    Notification::assertNothingSent();
});
