<?php

use App\Enums\Role;
use App\Models\User;

beforeEach(function () {
    $this->staff   = User::factory()->create(['role' => Role::ShelterStaff]);
    $this->shelter = makeTestShelter($this->staff);
});

// ── Visibility ───────────────────────────────────────────────────────────────

it('returns 200 for guests', function () {
    $this->get(route('pets.index'))->assertOk();
});

it('includes all available pets when there are no filters', function () {
    makeTestPet($this->staff, $this->shelter, ['name' => 'Alpha', 'availability_status' => true]);
    makeTestPet($this->staff, $this->shelter, ['name' => 'Beta',  'availability_status' => true]);

    $this->get(route('pets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('pets', 2));
});

it('excludes unavailable pets', function () {
    makeTestPet($this->staff, $this->shelter, ['name' => 'Visible',   'availability_status' => true]);
    makeTestPet($this->staff, $this->shelter, ['name' => 'Hidden',    'availability_status' => false]);

    $this->get(route('pets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.name', 'Visible')
        );
});

// ── Filters ───────────────────────────────────────────────────────────────────

it('filters by species', function () {
    makeTestPet($this->staff, $this->shelter, ['species' => 'Dog', 'name' => 'Buddy']);
    makeTestPet($this->staff, $this->shelter, ['species' => 'Cat', 'name' => 'Whiskers']);

    $this->get(route('pets.index', ['species' => 'Dog']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.species', 'Dog')
        );
});

it('filters by multiple species (comma-separated)', function () {
    makeTestPet($this->staff, $this->shelter, ['species' => 'Dog']);
    makeTestPet($this->staff, $this->shelter, ['species' => 'Cat']);
    makeTestPet($this->staff, $this->shelter, ['species' => 'Rabbit']);

    $this->get(route('pets.index', ['species' => 'Dog,Cat']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('pets', 2));
});

it('filters by size', function () {
    makeTestPet($this->staff, $this->shelter, ['size' => 'Small', 'name' => 'Tiny']);
    makeTestPet($this->staff, $this->shelter, ['size' => 'Large', 'name' => 'Big']);

    $this->get(route('pets.index', ['size' => 'Small']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.size', 'Small')
        );
});

it('filters by gender', function () {
    makeTestPet($this->staff, $this->shelter, ['gender' => 'Male',   'name' => 'Rex']);
    makeTestPet($this->staff, $this->shelter, ['gender' => 'Female', 'name' => 'Bella']);

    $this->get(route('pets.index', ['gender' => 'Female']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.gender', 'Female')
        );
});

it('filters by minimum age', function () {
    makeTestPet($this->staff, $this->shelter, ['age' => 1, 'name' => 'Young']);
    makeTestPet($this->staff, $this->shelter, ['age' => 5, 'name' => 'Old']);

    $this->get(route('pets.index', ['age_min' => 3]))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.age', 5)
        );
});

it('filters by maximum age', function () {
    makeTestPet($this->staff, $this->shelter, ['age' => 1, 'name' => 'Young']);
    makeTestPet($this->staff, $this->shelter, ['age' => 5, 'name' => 'Old']);

    $this->get(route('pets.index', ['age_max' => 2]))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.age', 1)
        );
});

it('filters by maximum adoption fee', function () {
    makeTestPet($this->staff, $this->shelter, ['adoption_fee' => 50,  'name' => 'Cheap']);
    makeTestPet($this->staff, $this->shelter, ['adoption_fee' => 500, 'name' => 'Pricey']);

    $this->get(route('pets.index', ['adoption_fee_max' => 100]))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('pets', 1));
});

it('filters by breed with a partial match', function () {
    makeTestPet($this->staff, $this->shelter, ['breed' => 'Labrador Retriever', 'name' => 'Lab']);
    makeTestPet($this->staff, $this->shelter, ['breed' => 'Poodle',             'name' => 'Poodle']);

    $this->get(route('pets.index', ['breed' => 'Labrador']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.breed', 'Labrador Retriever')
        );
});

it('searches by name using the q parameter', function () {
    makeTestPet($this->staff, $this->shelter, ['name' => 'Buddy']);
    makeTestPet($this->staff, $this->shelter, ['name' => 'Max']);

    $this->get(route('pets.index', ['q' => 'Buddy']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pets', 1)
                 ->where('pets.0.name', 'Buddy')
        );
});

// ── Response structure ────────────────────────────────────────────────────────

it('returns pagination metadata', function () {
    makeTestPet($this->staff, $this->shelter);

    $this->get(route('pets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('pagination')
                 ->has('pagination.total')
                 ->has('pagination.per_page')
                 ->has('pagination.current_page')
                 ->has('pagination.last_page')
        );
});

it('echoes active filter values back in the response', function () {
    $this->get(route('pets.index', ['species' => 'Dog', 'size' => 'Large', 'gender' => 'Male']))
        ->assertOk()
        ->assertInertia(fn ($page) =>
            $page->has('filters')
                 ->where('filters.species', 'Dog')
                 ->where('filters.size', 'Large')
                 ->where('filters.gender', 'Male')
        );
});

it('includes the shelters list for the filter sidebar', function () {
    makeTestShelter($this->staff, 'Another Shelter');

    $this->get(route('pets.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->has('shelters'));
});
