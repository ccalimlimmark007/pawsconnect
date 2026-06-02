<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\Role;
use App\Models\AdoptionApplication;
use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== Role::Adopter) {
            return $this->forbidden('Only adopters can view adoption applications.');
        }

        $paginator = AdoptionApplication::with(['pet.petImages'])
            ->where('user_id', $user->id)
            ->latest()
            ->paginate((int) $request->input('per_page', 20));

        return $this->paginated($paginator, fn (AdoptionApplication $app) => $this->transformApplication($app));
    }

    public function show(Request $request, int $application): JsonResponse
    {
        $user  = $request->user();
        $model = AdoptionApplication::with(['pet.petImages', 'homeVisit'])->find($application);

        if (! $model) {
            return $this->notFound('Application not found.');
        }

        if ((int) $model->user_id !== (int) $user->id) {
            return $this->forbidden('You do not have access to this application.');
        }

        return $this->ok($this->transformApplicationFull($model));
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->role !== Role::Adopter) {
            return $this->forbidden('Only adopters can submit adoption applications.');
        }

        $validated = $request->validate([
            'pet_id'               => ['required', 'integer', 'exists:pets,id'],
            'home_type'            => ['required', 'string', 'max:100'],
            'has_yard'             => ['required', 'boolean'],
            'has_children'         => ['required', 'boolean'],
            'has_other_pets'       => ['required', 'boolean'],
            'other_pets_description' => ['nullable', 'string', 'max:500'],
            'work_hours_per_day'   => ['nullable', 'integer', 'min:0', 'max:24'],
            'reason_for_adopting'  => ['required', 'string', 'min:20'],
            'prior_pet_experience' => ['nullable', 'string', 'max:1000'],
            'references'           => ['nullable', 'array'],
            'references.*.name'    => ['required_with:references', 'string', 'max:100'],
            'references.*.phone'   => ['nullable', 'string', 'max:50'],
            'references.*.email'   => ['nullable', 'email'],
        ]);

        $petId = $validated['pet_id'];

        $pet = Pet::find($petId);
        if (! $pet || ! $pet->availability_status) {
            return response()->json(['message' => 'This pet is not currently available for adoption.'], 422);
        }

        $duplicate = AdoptionApplication::where('user_id', $user->id)
            ->where('pet_id', $petId)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($duplicate) {
            return response()->json([
                'message' => "You already have a {$duplicate->status} application for this pet.",
                'errors'  => ['pet_id' => ["You already have a {$duplicate->status} application for this pet."]],
            ], 422);
        }

        $application = AdoptionApplication::create(array_merge($validated, [
            'user_id'    => $user->id,
            'status'     => 'pending',
            'dedup_key'  => $petId,
            'started_at' => now(),
        ]));

        return $this->created($this->transformApplication($application), 'Application submitted successfully.');
    }

    private function transformApplication(AdoptionApplication $app): array
    {
        return [
            'id'          => $app->id,
            'pet_id'      => $app->pet_id,
            'pet_name'    => $app->pet?->name,
            'pet_image'   => $app->pet?->petImages->firstWhere('is_primary', true)?->url
                ?? $app->pet?->petImages->first()?->url,
            'status'      => $app->status,
            'submitted_at' => $app->started_at?->toIso8601String(),
            'reviewed_at' => $app->reviewed_at?->toIso8601String(),
            'notes'       => $app->notes,
        ];
    }

    private function transformApplicationFull(AdoptionApplication $app): array
    {
        return array_merge($this->transformApplication($app), [
            'home_type'              => $app->home_type,
            'has_yard'               => $app->has_yard,
            'has_children'           => $app->has_children,
            'has_other_pets'         => $app->has_other_pets,
            'other_pets_description' => $app->other_pets_description,
            'work_hours_per_day'     => $app->work_hours_per_day,
            'reason_for_adopting'    => $app->reason_for_adopting,
            'prior_pet_experience'   => $app->prior_pet_experience,
            'rejected_reason'        => $app->rejected_reason,
            'home_visit'             => $app->homeVisit ? [
                'visit_date'     => $app->homeVisit->visit_date?->toIso8601String(),
                'status'         => $app->homeVisit->status,
                'assigned_staff' => $app->homeVisit->assigned_staff,
            ] : null,
        ]);
    }
}
