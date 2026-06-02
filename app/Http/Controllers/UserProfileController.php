<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use App\Models\Pet;
use App\Models\ShelterVisit;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UserProfileController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('Profile', [
            'status'         => session('status'),
            'adopterProfile' => $this->getAdopterProfile($user),
            'applications'   => $this->getApplications($user),
            'favoritePets'   => $this->getFavoritePets($user),
            'shelterVisits'  => $this->getShelterVisits($user),
        ]);
    }

    private function getAdopterProfile($user): ?array
    {
        if (! $user?->isAdopter()) {
            return null;
        }

        $p = $user->adopterProfile;

        if (! $p) {
            return null;
        }

        return [
            'home_type'         => $p->home_type,
            'has_yard'          => $p->has_yard,
            'activity_level'    => $p->activity_level,
            'experience_level'  => $p->experience_level,
            'preferred_species' => $p->preferred_species ?? [],
            'preferred_size'    => $p->preferred_size ?? [],
        ];
    }

    private function getApplications($user): array
    {
        if (! $user?->isAdopter()) {
            return [];
        }

        return AdoptionApplication::with([
            'pet:id,name,species,created_by',
            'pet.petImages',
            'reviewer:id,name',
            'homeVisit.assignedStaff:id,name',
        ])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($app) => [
                'id'             => $app->id,
                'status'         => $app->status,
                'createdAt'      => optional($app->created_at)?->toDateString(),
                'reviewedAt'     => optional($app->reviewed_at)?->toDateString(),
                'pet'            => $app->pet ? [
                    'id'       => (string) $app->pet->id,
                    'name'     => $app->pet->name,
                    'species'  => $app->pet->species,
                    'imageUrl' => $app->pet->petImages->firstWhere('is_primary', true)?->url
                        ?? $app->pet->petImages->first()?->url,
                ] : null,
                'notes'          => $app->notes,
                'rejectedReason' => $app->rejected_reason,
                'reviewedBy'     => $app->reviewer?->name,
                'homeVisit'      => $app->homeVisit ? [
                    'visitDateFormatted' => $app->homeVisit->visit_date->format('M j, Y g:i A'),
                    'status'             => $app->homeVisit->status,
                    'assignedStaffName'  => $app->homeVisit->assignedStaff?->name,
                    'notes'              => $app->homeVisit->notes,
                ] : null,
            ])
            ->toArray();
    }

    private function getFavoritePets($user): array
    {
        $favoriteIds = $user?->favorites ?? [];

        if (empty($favoriteIds)) {
            return [];
        }

        return Pet::with(['petImages', 'shelter'])
            ->whereIn('id', $favoriteIds)
            ->where('availability_status', true)
            ->get()
            ->map(fn ($pet) => [
                'id'          => (string) $pet->id,
                'name'        => $pet->name,
                'species'     => $pet->species,
                'breed'       => $pet->breed,
                'age'         => $pet->age,
                'ageUnit'     => $pet->age_unit,
                'imageUrl'    => $pet->petImages->firstWhere('is_primary', true)?->url
                    ?? $pet->petImages->first()?->url,
                'adoptionFee' => (float) $pet->adoption_fee,
                'shelterName' => $pet->shelter?->name,
            ])
            ->toArray();
    }

    private function getShelterVisits($user): array
    {
        if (! $user?->isAdopter()) {
            return [];
        }

        return ShelterVisit::with(['pet.petImages'])
            ->where('user_id', $user->id)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->orderBy('visit_date', 'asc')
            ->limit(5)
            ->get()
            ->map(fn ($v) => [
                'id'        => $v->id,
                'petId'     => (string) $v->pet_id,
                'petName'   => $v->pet?->name,
                'petImage'  => $v->pet?->petImages->firstWhere('is_primary', true)?->url
                    ?? $v->pet?->petImages->first()?->url,
                'visitDate' => $v->visit_date->format('M j, Y'),
                'visitTime' => Carbon::createFromFormat('H:i', substr($v->visit_time, 0, 5))->format('g:i A'),
                'status'    => $v->status,
                'message'   => $v->message,
            ])
            ->toArray();
    }
}
