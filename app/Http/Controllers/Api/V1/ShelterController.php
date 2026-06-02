<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Shelter;
use Illuminate\Http\JsonResponse;

class ShelterController extends Controller
{
    public function index(): JsonResponse
    {
        $shelters = Shelter::with('shelterContact')
            ->withCount('pets')
            ->orderBy('name')
            ->get();

        return $this->ok($shelters->map(fn (Shelter $s) => $this->transformShelter($s)));
    }

    public function show(int $shelter): JsonResponse
    {
        $model = Shelter::with(['shelterContact', 'pets.petImages'])
            ->withCount('pets')
            ->find($shelter);

        if (! $model) {
            return $this->notFound('Shelter not found.');
        }

        return $this->ok(array_merge($this->transformShelter($model), [
            'available_pets_count' => $model->pets->where('availability_status', true)->count(),
        ]));
    }

    private function transformShelter(Shelter $shelter): array
    {
        return [
            'id'         => $shelter->id,
            'name'       => $shelter->name,
            'pets_count' => $shelter->pets_count ?? 0,
            'contact'    => $shelter->shelterContact ? [
                'phone'   => $shelter->shelterContact->phone,
                'email'   => $shelter->shelterContact->email,
                'address' => $shelter->shelterContact->address,
                'hours'   => $shelter->shelterContact->hours,
            ] : null,
            'created_at' => $shelter->created_at?->toIso8601String(),
        ];
    }
}
