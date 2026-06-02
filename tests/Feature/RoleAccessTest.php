<?php

use App\Enums\Role;
use App\Models\User;

// Disable Vite for the whole file so pages missing from the local build manifest
// don't throw exceptions on initial page loads, and the Inertia version check
// (which reads the manifest MD5) always gets null → no 409 conflicts.
beforeEach(fn () => $this->withoutVite());

// ── Admin-only routes (/admin/*) ──────────────────────────────────────────────

it('redirects guests away from the admin dashboard', function () {
    $this->get(route('admin.dashboard'))->assertRedirect(route('login'));
});

it('forbids adopters from accessing the admin dashboard', function () {
    $adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->actingAs($adopter)->get(route('admin.dashboard'))->assertForbidden();
});

it('forbids shelter staff from accessing the admin dashboard', function () {
    $staff = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->actingAs($staff)->get(route('admin.dashboard'))->assertForbidden();
});

it('allows admins to access the admin dashboard', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $this->actingAs($admin)->get(route('admin.dashboard'))->assertOk();
});

// ── Shelter staff + admin routes ──────────────────────────────────────────────

it('redirects guests away from the post-pet page', function () {
    $this->get(route('pets.post'))->assertRedirect(route('login'));
});

it('forbids adopters from accessing the post-pet page', function () {
    $adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->actingAs($adopter)->get(route('pets.post'))->assertForbidden();
});

it('allows shelter staff to access the post-pet page', function () {
    $staff = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->actingAs($staff)->get(route('pets.post'))->assertOk();
});

it('allows admins to access the post-pet page', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $this->actingAs($admin)->get(route('pets.post'))->assertOk();
});

it('redirects guests away from the applications management page', function () {
    $this->get(route('admin.applications'))->assertRedirect(route('login'));
});

it('forbids adopters from accessing the applications management page', function () {
    $adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->actingAs($adopter)->get(route('admin.applications'))->assertForbidden();
});

it('allows shelter staff to access the applications management page', function () {
    $staff = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->actingAs($staff)->get(route('admin.applications'))->assertOk();
});

it('allows admins to access the applications management page', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $this->actingAs($admin)->get(route('admin.applications'))->assertOk();
});

// ── Adopter-only routes ───────────────────────────────────────────────────────

it('redirects guests away from my-applications', function () {
    $this->get(route('pets.my-applications'))->assertRedirect(route('login'));
});

it('forbids shelter staff from viewing my-applications', function () {
    $staff = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->actingAs($staff)->get(route('pets.my-applications'))->assertForbidden();
});

it('forbids admins from viewing my-applications', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $this->actingAs($admin)->get(route('pets.my-applications'))->assertForbidden();
});

it('allows adopters to view my-applications', function () {
    $adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->actingAs($adopter)->get(route('pets.my-applications'))->assertOk();
});

it('redirects guests away from the preferences page', function () {
    $this->get(route('profile.preferences'))->assertRedirect(route('login'));
});

it('forbids shelter staff from accessing the preferences page', function () {
    $staff = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->actingAs($staff)->get(route('profile.preferences'))->assertForbidden();
});

it('allows adopters to access the preferences page', function () {
    $adopter = User::factory()->create(['role' => Role::Adopter]);
    $this->actingAs($adopter)->get(route('profile.preferences'))->assertOk();
});
