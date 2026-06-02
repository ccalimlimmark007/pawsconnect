<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use App\Models\Pet;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $user = $request->user();

        $myPets = Pet::where('created_by', $user->id)
            ->withCount(['adoptionApplications as pending_count' => fn ($q) => $q->where('status', 'pending')])
            ->with(['petImages'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($pet) => [
                'id'               => (string) $pet->id,
                'name'             => $pet->name,
                'species'          => (string) $pet->species,
                'breed'            => $pet->breed,
                'availabilityStatus' => $pet->availability_status,
                'pendingCount'     => (int) $pet->pending_count,
                'imageUrl'         => $pet->petImages->firstWhere('is_primary', true)?->url
                                      ?? $pet->petImages->first()?->url,
                'createdAt'        => $pet->created_at->toDateString(),
            ]);

        $recentApplications = AdoptionApplication::with(['user:id,name,email', 'pet:id,name'])
            ->whereHas('pet', fn ($q) => $q->where('created_by', $user->id))
            ->whereIn('status', ['pending', 'started'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn ($app) => [
                'id'        => $app->id,
                'status'    => $app->status,
                'createdAt' => $app->created_at->toDateString(),
                'user'      => $app->user ? ['name' => $app->user->name, 'email' => $app->user->email] : null,
                'pet'       => $app->pet ? ['id' => (string) $app->pet->id, 'name' => $app->pet->name] : null,
            ]);

        return Inertia::render('Staff/Dashboard', [
            'myPets'             => $myPets->values(),
            'totalPets'          => $myPets->count(),
            'totalPending'       => $myPets->sum('pendingCount'),
            'recentApplications' => $recentApplications,
        ]);
    }
}
