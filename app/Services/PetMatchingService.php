<?php

namespace App\Services;

use App\Models\AdopterProfile;
use App\Models\Pet;
use Illuminate\Support\Collection;

class PetMatchingService
{
    // Scoring weights (must sum to 100)
    private const WEIGHT_SPECIES    = 40;
    private const WEIGHT_SIZE       = 25;
    private const WEIGHT_ACTIVITY   = 20;
    private const WEIGHT_EXPERIENCE = 10;
    private const WEIGHT_VETTED     =  5;

    // Temperament tags that correlate with each activity level
    private const ACTIVITY_TAG_MAP = [
        'low'      => ['calm', 'gentle', 'quiet', 'mellow', 'relaxed', 'lazy', 'docile', 'independent', 'low-energy'],
        'moderate' => ['playful', 'friendly', 'social', 'curious', 'affectionate', 'adaptable', 'balanced'],
        'high'     => ['energetic', 'active', 'athletic', 'adventurous', 'lively', 'spirited', 'high-energy'],
    ];

    // Tags considered safe/easy for first-time owners
    private const BEGINNER_FRIENDLY_TAGS = [
        'gentle', 'calm', 'friendly', 'affectionate', 'docile', 'adaptable', 'easy-going', 'social',
    ];

    /**
     * Return a 0–100 compatibility score for a single pet against an adopter profile.
     */
    public function score(AdopterProfile $profile, Pet $pet): int
    {
        $score   = 0;
        $petTags = array_map('strtolower', $pet->temperament_tags ?? []);

        // 1. Species preference (0 or 40 pts)
        if (! empty($profile->preferred_species) && in_array($pet->species, $profile->preferred_species, true)) {
            $score += self::WEIGHT_SPECIES;
        }

        // 2. Size preference (0 or 25 pts)
        if (! empty($profile->preferred_size) && in_array($pet->size, $profile->preferred_size, true)) {
            $score += self::WEIGHT_SIZE;
        }

        // 3. Activity level → temperament alignment (0–20 pts, 7 pts per matching tag)
        if ($profile->activity_level && ! empty($petTags)) {
            $expectedTags = self::ACTIVITY_TAG_MAP[$profile->activity_level] ?? [];
            $matches      = count(array_intersect($expectedTags, $petTags));
            $score        += min(self::WEIGHT_ACTIVITY, $matches * 7);
        }

        // 4. Experience level alignment (0–10 pts)
        if ($profile->experience_level) {
            if ($profile->experience_level === 'experienced') {
                // Experienced owners can handle any pet
                $score += self::WEIGHT_EXPERIENCE;
            } elseif (! empty($petTags)) {
                $beginnerMatches = count(array_intersect(self::BEGINNER_FRIENDLY_TAGS, $petTags));
                if ($beginnerMatches > 0) {
                    $score += min(self::WEIGHT_EXPERIENCE, $beginnerMatches * 5);
                }
            }
        }

        // 5. Vetted bonus (0 or 5 pts)
        if ($pet->is_vetted) {
            $score += self::WEIGHT_VETTED;
        }

        return min(100, $score);
    }

    /**
     * Rank a collection of pets by compatibility score descending.
     * Returns a collection of ['pet' => Pet, 'score' => int] arrays.
     */
    public function rank(AdopterProfile $profile, Collection $pets): Collection
    {
        return $pets
            ->map(fn (Pet $pet) => ['pet' => $pet, 'score' => $this->score($profile, $pet)])
            ->filter(fn (array $item) => $item['score'] > 0)
            ->sortByDesc('score')
            ->values();
    }

    /**
     * Whether the profile has enough data to generate meaningful matches.
     * A profile with only a vetted-bonus would score every pet 5 pts — not useful.
     */
    public function hasMatchablePreferences(AdopterProfile $profile): bool
    {
        return ! empty($profile->preferred_species)
            || ! empty($profile->preferred_size)
            || ! empty($profile->activity_level)
            || ! empty($profile->experience_level);
    }
}
