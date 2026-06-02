<?php

use App\Models\AdopterProfile;
use App\Models\Pet;
use App\Models\User;
use App\Services\PetMatchingService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// Helper: build an unsaved AdopterProfile with given attributes
function makeProfile(array $attrs = []): AdopterProfile
{
    return new AdopterProfile(array_merge([
        'preferred_species' => [],
        'preferred_size'    => [],
        'activity_level'    => null,
        'experience_level'  => null,
    ], $attrs));
}

// Helper: build an unsaved Pet with given attributes
function makePet(array $attrs = []): Pet
{
    return new Pet(array_merge([
        'species'          => 'Dog',
        'size'             => 'Medium',
        'temperament_tags' => [],
        'is_vetted'        => false,
    ], $attrs));
}

beforeEach(function () {
    $this->service = new PetMatchingService();
});

it('scores zero when profile has no preferences and pet is not vetted', function () {
    $profile = makeProfile();
    $pet     = makePet(['is_vetted' => false]);

    expect($this->service->score($profile, $pet))->toBe(0);
});

it('scores 40 for a species match', function () {
    $profile = makeProfile(['preferred_species' => ['Dog']]);
    $pet     = makePet(['species' => 'Dog', 'is_vetted' => false]);

    expect($this->service->score($profile, $pet))->toBe(40);
});

it('scores 25 for a size match', function () {
    $profile = makeProfile(['preferred_size' => ['Medium']]);
    $pet     = makePet(['size' => 'Medium', 'is_vetted' => false]);

    expect($this->service->score($profile, $pet))->toBe(25);
});

it('scores 65 for species + size match', function () {
    $profile = makeProfile([
        'preferred_species' => ['Dog'],
        'preferred_size'    => ['Medium'],
    ]);
    $pet = makePet(['species' => 'Dog', 'size' => 'Medium', 'is_vetted' => false]);

    expect($this->service->score($profile, $pet))->toBe(65);
});

it('scores up to 20 for activity level alignment via temperament tags', function () {
    $profile = makeProfile(['activity_level' => 'high']);
    $pet     = makePet([
        'temperament_tags' => ['energetic', 'active'],
        'is_vetted'        => false,
    ]);

    // 2 tags × 7 pts = 14
    expect($this->service->score($profile, $pet))->toBe(14);
});

it('caps activity score at 20 even with many matching tags', function () {
    $profile = makeProfile(['activity_level' => 'high']);
    $pet     = makePet([
        'temperament_tags' => ['energetic', 'active', 'athletic', 'adventurous', 'lively'],
        'is_vetted'        => false,
    ]);

    expect($this->service->score($profile, $pet))->toBe(20);
});

it('gives 10 pts to experienced owners for any pet', function () {
    $profile = makeProfile(['experience_level' => 'experienced']);
    $pet     = makePet(['is_vetted' => false]);

    expect($this->service->score($profile, $pet))->toBe(10);
});

it('gives bonus to first-time owners for beginner-friendly pets', function () {
    $profile = makeProfile(['experience_level' => 'first_time']);
    $pet     = makePet([
        'temperament_tags' => ['gentle', 'calm'],
        'is_vetted'        => false,
    ]);

    // 2 beginner tags × 5 pts = 10, capped at 10
    expect($this->service->score($profile, $pet))->toBe(10);
});

it('adds 5 pts for vetted pets', function () {
    $profile = makeProfile();
    $pet     = makePet(['is_vetted' => true]);

    expect($this->service->score($profile, $pet))->toBe(5);
});

it('caps total score at 100', function () {
    $profile = makeProfile([
        'preferred_species' => ['Dog'],
        'preferred_size'    => ['Medium'],
        'activity_level'    => 'high',
        'experience_level'  => 'experienced',
    ]);
    $pet = makePet([
        'species'          => 'Dog',
        'size'             => 'Medium',
        'temperament_tags' => ['energetic', 'active', 'athletic', 'adventurous'],
        'is_vetted'        => true,
    ]);

    expect($this->service->score($profile, $pet))->toBe(100);
});

it('does not report matchable preferences when profile is empty', function () {
    $profile = makeProfile();
    expect($this->service->hasMatchablePreferences($profile))->toBeFalse();
});

it('reports matchable preferences when species is set', function () {
    $profile = makeProfile(['preferred_species' => ['Cat']]);
    expect($this->service->hasMatchablePreferences($profile))->toBeTrue();
});

it('ranks pets by score descending and filters zero-score pets', function () {
    $profile = makeProfile(['preferred_species' => ['Dog']]);

    $dog = makePet(['species' => 'Dog',  'is_vetted' => false]);
    $cat = makePet(['species' => 'Cat',  'is_vetted' => false]);

    $ranked = $this->service->rank($profile, collect([$cat, $dog]));

    expect($ranked)->toHaveCount(1)
        ->and($ranked->first()['pet']->species)->toBe('Dog')
        ->and($ranked->first()['score'])->toBe(40);
});
