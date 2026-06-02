<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PetController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Pet::with(['shelter', 'petImages'])
            ->where('availability_status', true);

        $query
            ->when($request->filled('q'), function ($q) use ($request) {
                $term = $request->input('q');
                $q->where(function ($inner) use ($term) {
                    $inner->where('name', 'LIKE', "%{$term}%")
                          ->orWhere('breed', 'LIKE', "%{$term}%")
                          ->orWhere('description', 'LIKE', "%{$term}%");
                });
            })
            ->when($request->filled('species'), function ($q) use ($request) {
                $q->whereIn('species', array_filter(array_map('trim', explode(',', $request->input('species')))));
            })
            ->when($request->filled('breed'), function ($q) use ($request) {
                $q->where('breed', 'LIKE', '%' . $request->input('breed') . '%');
            })
            ->when($request->filled('size'), function ($q) use ($request) {
                $q->whereIn('size', array_filter(array_map('trim', explode(',', $request->input('size')))));
            })
            ->when($request->filled('gender'), function ($q) use ($request) {
                $q->whereIn('gender', array_filter(array_map('trim', explode(',', $request->input('gender')))));
            })
            ->when($request->filled('shelter_id'), function ($q) use ($request) {
                $q->where('shelter_id', (int) $request->input('shelter_id'));
            })
            ->when($request->filled('age_min'), function ($q) use ($request) {
                $q->where('age', '>=', (int) $request->input('age_min'));
            })
            ->when($request->filled('age_max'), function ($q) use ($request) {
                $q->where('age', '<=', (int) $request->input('age_max'));
            })
            ->when($request->filled('adoption_fee_max'), function ($q) use ($request) {
                $q->where('adoption_fee', '<=', (float) $request->input('adoption_fee_max'));
            });

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginator = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return $this->paginated($paginator, fn (Pet $pet) => $this->transformPet($pet));
    }

    public function show(int $pet): JsonResponse
    {
        $model = Pet::with(['shelter.shelterContact', 'petImages', 'medicalRecords'])->find($pet);

        if (! $model) {
            return $this->notFound('Pet not found.');
        }

        return $this->ok($this->transformPetFull($model));
    }

    private function transformPet(Pet $pet): array
    {
        return [
            'id'                 => $pet->id,
            'name'               => $pet->name,
            'species'            => $pet->species,
            'breed'              => $pet->breed,
            'age'                => $pet->age,
            'age_unit'           => $pet->age_unit,
            'gender'             => $pet->gender,
            'size'               => $pet->size,
            'color'              => $pet->color,
            'is_vetted'          => $pet->is_vetted,
            'adoption_fee'       => (float) $pet->adoption_fee,
            'shelter_name'       => $pet->shelter?->name,
            'image_url'          => $pet->petImages->firstWhere('is_primary', true)?->url
                ?? $pet->petImages->first()?->url,
            'created_at'         => $pet->created_at?->toIso8601String(),
        ];
    }

    private function transformPetFull(Pet $pet): array
    {
        return array_merge($this->transformPet($pet), [
            'description'          => $pet->description,
            'medical_status'       => $pet->medical_status,
            'temperament_tags'     => $pet->temperament_tags ?? [],
            'personality_traits'   => $pet->personality_traits ?? [],
            'good_with'            => $pet->good_with ?? [],
            'not_good_with'        => $pet->not_good_with ?? [],
            'special_needs'        => $pet->special_needs,
            'dietary_needs'        => $pet->dietary_needs,
            'exercise_requirements' => $pet->exercise_requirements,
            'images'               => $pet->petImages->map(fn ($img) => [
                'id'         => $img->id,
                'url'        => $img->url,
                'is_primary' => $img->is_primary,
            ])->values(),
            'shelter_contact'      => $pet->shelter?->shelterContact ? [
                'phone'   => $pet->shelter->shelterContact->phone,
                'email'   => $pet->shelter->shelterContact->email,
                'address' => $pet->shelter->shelterContact->address,
                'hours'   => $pet->shelter->shelterContact->hours,
            ] : null,
            'medical_records'      => $pet->medicalRecords->map(fn ($r) => [
                'type'        => $r->type,
                'description' => $r->description,
                'notes'       => $r->notes,
                'record_date' => $r->record_date?->toDateString(),
            ])->values(),
        ]);
    }
}
