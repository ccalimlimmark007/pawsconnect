<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FavoriteController extends Controller
{
    public function page(Request $request): Response
    {
        $user        = $request->user();
        $favoriteIds = $user?->favorites ?? [];

        $favoritePets = [];
        if (! empty($favoriteIds)) {
            $favoritePets = Pet::with(['petImages', 'shelter'])
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

        return Inertia::render('MyFavorites', ['favoritePets' => $favoritePets]);
    }

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json(['favorites' => array_values($user->favorites ?? [])]);
    }

    public function toggle(Request $request): JsonResponse
    {
        $request->validate(['id' => 'required|string']);

        $user      = $request->user();
        $petId     = (string) $request->input('id');
        $favorites = $user->favorites ?? [];

        if (in_array($petId, $favorites, true)) {
            $favorites = array_values(array_filter($favorites, fn ($id) => $id !== $petId));
            $added     = false;
        } else {
            $favorites[] = $petId;
            $added       = true;
        }

        $user->update(['favorites' => array_values($favorites)]);

        return response()->json([
            'favorites' => array_values($favorites),
            'added'     => $added,
        ]);
    }
}
