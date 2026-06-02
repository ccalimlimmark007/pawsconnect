<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Shelter;
use App\Models\ShelterVisit;
use App\Services\PetMatchingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class PetController extends Controller
{
    public function index(Request $request): Response
    {
        $user           = $request->user();
        $adopterProfile = ($user && $user->isAdopter()) ? $user->adopterProfile : null;

        $browseAll  = $request->boolean('browse_all');
        $hasFilters = $request->hasAny([
            'q', 'species', 'breed', 'size', 'gender', 'shelter_id', 'age_min', 'age_max', 'adoption_fee_max',
        ]);

        $applyPrefs         = $adopterProfile && ! $browseAll && ! $hasFilters;
        $preferencesApplied = $applyPrefs && (
            ! empty($adopterProfile->preferred_species) || ! empty($adopterProfile->preferred_size)
        );

        $speciesInput = ($applyPrefs && ! empty($adopterProfile->preferred_species))
            ? implode(',', $adopterProfile->preferred_species)
            : $request->input('species', '');

        $sizeInput = ($applyPrefs && ! empty($adopterProfile->preferred_size))
            ? implode(',', $adopterProfile->preferred_size)
            : $request->input('size', '');

        $query = Pet::with(['shelter.shelterContact', 'medicalRecords', 'petImages'])
            ->where('availability_status', true);

        $query
            ->when($request->filled('q'), fn ($q) => $q->fullTextSearch($request->input('q')))
            ->when($speciesInput, function ($q) use ($speciesInput) {
                $species = array_filter(array_map('trim', explode(',', $speciesInput)));
                if ($species) {
                    $q->whereIn('species', $species);
                }
            })
            ->when($request->filled('breed'), fn ($q) => $q->where('breed', 'LIKE', '%'.$request->input('breed').'%'))
            ->when($sizeInput, function ($q) use ($sizeInput) {
                $sizes = array_filter(array_map('trim', explode(',', $sizeInput)));
                if ($sizes) {
                    $q->whereIn('size', $sizes);
                }
            })
            ->when($request->filled('gender'), function ($q) use ($request) {
                $genders = array_filter(array_map('trim', explode(',', $request->input('gender'))));
                if ($genders) {
                    $q->whereIn('gender', $genders);
                }
            })
            ->when($request->filled('shelter_id'), fn ($q) => $q->where('shelter_id', (int) $request->input('shelter_id')))
            ->when($request->filled('age_min'), fn ($q) => $q->where('age', '>=', (int) $request->input('age_min')))
            ->when($request->filled('age_max'), fn ($q) => $q->where('age', '<=', (int) $request->input('age_max')))
            ->when($request->filled('adoption_fee_max'), fn ($q) => $q->where('adoption_fee', '<=', (float) $request->input('adoption_fee_max')));

        if ($request->filled('q')) {
            $query->orderByRelevance($request->input('q'));
        }

        $paginator = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        $pets = collect($paginator->items())->map(fn ($pet) => $this->formatPetForListing($pet));

        $matches = $this->resolveMatches($user, $adopterProfile);

        return Inertia::render('Pets/Index', [
            'pets'       => $pets,
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
            'filters' => [
                'q'                => $request->input('q', ''),
                'species'          => $speciesInput,
                'breed'            => $request->input('breed', ''),
                'size'             => $sizeInput,
                'gender'           => $request->input('gender', ''),
                'shelter_id'       => $request->input('shelter_id', ''),
                'age_min'          => $request->input('age_min'),
                'age_max'          => $request->input('age_max'),
                'adoption_fee_max' => $request->input('adoption_fee_max'),
                'browse_all'       => $browseAll ? '1' : '',
            ],
            'preferencesApplied' => $preferencesApplied,
            'adopterPreferences' => $adopterProfile ? [
                'species'          => $adopterProfile->preferred_species ?? [],
                'size'             => $adopterProfile->preferred_size ?? [],
                'home_type'        => $adopterProfile->home_type,
                'activity_level'   => $adopterProfile->activity_level,
                'experience_level' => $adopterProfile->experience_level,
            ] : null,
            'matches'  => $matches->values()->toArray(),
            'shelters' => Shelter::orderBy('name')->get(['id', 'name'])->toArray(),
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $pet = Pet::with(['shelter.shelterContact', 'medicalRecords', 'petImages'])->find($id);

        if (! $pet) {
            return Inertia::render('Pets/Show', ['petId' => $id]);
        }

        $user            = $request->user();
        $canManageImages = $user && ($user->isAdmin() ||
            ($user->isShelterStaff() && (int) $pet->created_by === (int) $user->id));

        $existingVisit = auth()->check()
            ? ShelterVisit::where('user_id', auth()->id())
                ->where('pet_id', $pet->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->first()
            : null;

        return Inertia::render('Pets/Show', [
            'petId'           => (string) $id,
            'canManageImages' => $canManageImages,
            'existingVisit'   => $existingVisit,
            'pet'             => [
                'id'              => (string) $pet->id,
                'name'            => $pet->name,
                'species'         => $pet->species,
                'breed'           => $pet->breed,
                'age'             => $pet->age,
                'ageUnit'         => $pet->age_unit,
                'gender'          => $pet->gender,
                'size'            => $pet->size,
                'temperamentTags' => $pet->temperament_tags ?? [],
                'medicalStatus'   => $pet->medical_status,
                'description'     => $pet->description,
                'imageUrl'        => $pet->petImages->firstWhere('is_primary', true)?->url
                    ?? $pet->petImages->first()?->url,
                'images' => $pet->petImages->map(fn ($img) => [
                    'id'        => $img->id,
                    'url'       => $img->url,
                    'isPrimary' => $img->is_primary,
                    'order'     => $img->order,
                ])->values(),
                'shelterName'    => $pet->shelter?->name,
                'adoptionFee'    => (float) $pet->adoption_fee,
                'dateAdded'      => optional($pet->created_at)?->toDateString(),
                'medicalHistory' => $pet->medicalRecords->map(fn ($record) => [
                    'title' => $record->type,
                    'note'  => $record->notes ?: $record->description,
                    'date'  => optional($record->record_date)?->toDateString()
                        ?: optional($record->created_at)?->toDateString(),
                ])->values(),
                'shelterContact' => $pet->shelter?->shelterContact ? [
                    'phone'   => $pet->shelter->shelterContact->phone,
                    'email'   => $pet->shelter->shelterContact->email,
                    'address' => $pet->shelter->shelterContact->address,
                    'hours'   => $pet->shelter->shelterContact->hours,
                ] : null,
            ],
        ]);
    }

    private function formatPetForListing(Pet $pet): array
    {
        return [
            'id'               => (string) $pet->id,
            'name'             => $pet->name,
            'species'          => $pet->species,
            'breed'            => $pet->breed,
            'age'              => $pet->age,
            'ageUnit'          => $pet->age_unit,
            'gender'           => $pet->gender,
            'size'             => $pet->size,
            'color'            => $pet->color,
            'weight'           => $pet->weight ? (float) $pet->weight : null,
            'temperamentTags'  => $pet->temperament_tags ?? [],
            'personalityTraits' => $pet->personality_traits ?? [],
            'medicalStatus'    => $pet->medical_status,
            'isVetted'         => $pet->is_vetted,
            'availabilityStatus' => $pet->availability_status,
            'description'      => $pet->description,
            'imageUrl'         => $pet->petImages->firstWhere('is_primary', true)?->url
                ?? $pet->petImages->first()?->url,
            'shelterName'    => $pet->shelter?->name,
            'adoptionFee'    => (float) $pet->adoption_fee,
            'dateAdded'      => optional($pet->created_at)?->toDateString(),
            'shelterContact' => $pet->shelter?->shelterContact ? [
                'phone'   => $pet->shelter->shelterContact->phone,
                'email'   => $pet->shelter->shelterContact->email,
                'address' => $pet->shelter->shelterContact->address,
                'hours'   => $pet->shelter->shelterContact->hours,
            ] : null,
            'medicalHistory' => $pet->medicalRecords->map(fn ($record) => [
                'title' => $record->type,
                'note'  => $record->notes ?: $record->description,
                'date'  => optional($record->record_date)?->toDateString()
                    ?: optional($record->created_at)?->toDateString(),
            ])->values()->toArray(),
        ];
    }

    private function resolveMatches($user, $adopterProfile): \Illuminate\Support\Collection
    {
        if (! $adopterProfile) {
            return collect();
        }

        $matchService = app(PetMatchingService::class);

        if (! $matchService->hasMatchablePreferences($adopterProfile)) {
            return collect();
        }

        $candidates = Pet::with(['petImages'])
            ->where('availability_status', true)
            ->latest()
            ->limit(60)
            ->get();

        $ranked = $matchService->rank($adopterProfile, $candidates)->take(4);

        $matches = $ranked->map(fn (array $item) => [
            'id'          => (string) $item['pet']->id,
            'name'        => $item['pet']->name,
            'species'     => $item['pet']->species,
            'breed'       => $item['pet']->breed,
            'size'        => $item['pet']->size,
            'age'         => $item['pet']->age,
            'ageUnit'     => $item['pet']->age_unit,
            'imageUrl'    => $item['pet']->petImages->firstWhere('is_primary', true)?->url
                ?? $item['pet']->petImages->first()?->url,
            'adoptionFee' => (float) $item['pet']->adoption_fee,
            'score'       => $item['score'],
        ]);

        $cacheKey = "match_log_{$user->id}_".now()->format('Y-m-d-H');
        if ($matches->isNotEmpty() && ! Cache::has($cacheKey)) {
            activity('pet-matching')
                ->causedBy($user)
                ->withProperties([
                    'top_matches' => $ranked->map(fn (array $m) => [
                        'pet_id' => $m['pet']->id,
                        'score'  => $m['score'],
                    ])->toArray(),
                ])
                ->log('Recommendations shown');

            Cache::put($cacheKey, true, now()->addHour());
        }

        return $matches;
    }
}
