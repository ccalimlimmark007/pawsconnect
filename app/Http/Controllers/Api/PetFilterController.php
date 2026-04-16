<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PetFilterController extends Controller
{
    /**
     * Get filtered and paginated pets
     * 
     * Query Parameters:
     * - q: Text search across name, breed, and personality_traits
     * - species: Filter by species (e.g., Dog, Cat) - can be comma-separated
     * - breed: Filter by breed - can be comma-separated
     * - gender: Filter by gender
     * - size: Filter by size - can be comma-separated
     * - age_min: Minimum age
     * - age_max: Maximum age
     * - is_vetted: Filter by vetted status (true/false)
     * - available_only: Show only available pets (default: true)
     * - sort_by: Sort field (date_posted, age, name) - default: date_posted
     * - sort_order: Sort order (asc, desc) - default: desc
     * - page: Page number for pagination - default: 1
     * - limit: Results per page - default: 12
     */
    public function index(Request $request): JsonResponse
    {
        $query = Pet::query()->with(['shelterContact', 'medicalRecords']);

        // Filter by availability (default: only show available pets)
        $availableOnly = $request->boolean('available_only', true);
        if ($availableOnly) {
            $query->where('availability_status', true);
        }

        // Text search across name, breed, and personality_traits
        if ($request->filled('q')) {
            $searchTerm = $request->input('q');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'LIKE', "%{$searchTerm}%")
                    ->orWhere('breed', 'LIKE', "%{$searchTerm}%")
                    ->orWhere('description', 'LIKE', "%{$searchTerm}%")
                    ->orWhereJsonContains('personality_traits', $searchTerm);
            });
        }

        // Filter by species (supports multiple values)
        if ($request->filled('species')) {
            $species = $this->parseCommaSeparated($request->input('species'));
            $query->whereIn('species', $species);
        }

        // Filter by breed (supports multiple values)
        if ($request->filled('breed')) {
            $breeds = $this->parseCommaSeparated($request->input('breed'));
            $query->whereIn('breed', $breeds);
        }

        // Filter by gender
        if ($request->filled('gender')) {
            $query->where('gender', $request->input('gender'));
        }

        // Filter by size (supports multiple values)
        if ($request->filled('size')) {
            $sizes = $this->parseCommaSeparated($request->input('size'));
            $query->whereIn('size', $sizes);
        }

        // Filter by age range
        if ($request->filled('age_min')) {
            $query->where('age', '>=', (int) $request->input('age_min'));
        }
        if ($request->filled('age_max')) {
            $query->where('age', '<=', (int) $request->input('age_max'));
        }

        // Filter by vetted status
        if ($request->filled('is_vetted')) {
            $query->where('is_vetted', $request->boolean('is_vetted'));
        }

        // Sorting
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');
        
        // Map friendly sort names
        $sortField = match($sortBy) {
            'date_posted' => 'created_at',
            'newest' => 'created_at',
            default => $sortBy,
        };

        $query->orderBy($sortField, $sortOrder);

        // Pagination
        $limit = min((int) $request->input('limit', 12), 100); // Cap at 100
        $page = (int) $request->input('page', 1);

        $pets = $query->paginate($limit, ['*'], 'page', $page);

        // Transform the data
        $data = $pets->map(function ($pet) {
            return [
                'id' => (string) $pet->id,
                'name' => $pet->name,
                'species' => $pet->species,
                'breed' => $pet->breed,
                'age' => $pet->age,
                'ageUnit' => $pet->age_unit,
                'gender' => $pet->gender,
                'size' => $pet->size,
                'color' => $pet->color,
                'weight' => $pet->weight ? (float) $pet->weight : null,
                'temperamentTags' => $pet->temperament_tags ?? [],
                'personalityTraits' => $pet->personality_traits ?? [],
                'medicalStatus' => $pet->medical_status,
                'isVetted' => $pet->is_vetted,
                'availabilityStatus' => $pet->availability_status,
                'description' => $pet->description,
                'imageUrl' => $pet->image_url,
                'shelterName' => $pet->shelter_name,
                'adoptionFee' => (float) $pet->adoption_fee,
                'dateAdded' => optional($pet->created_at)?->toDateString(),
                'shelterContact' => $pet->shelterContact ? [
                    'phone' => $pet->shelterContact->phone,
                    'email' => $pet->shelterContact->email,
                    'address' => $pet->shelterContact->address,
                    'hours' => $pet->shelterContact->hours,
                ] : null,
            ];
        });

        return response()->json([
            'total_results' => $pets->total(),
            'page' => $pets->currentPage(),
            'per_page' => $pets->perPage(),
            'last_page' => $pets->lastPage(),
            'data' => $data,
        ]);
    }

    /**
     * Get aggregate statistics for pets
     */
    public function stats(Request $request): JsonResponse
    {
        $availableCount = Pet::where('availability_status', true)->count();
        $totalCount = Pet::count();
        
        $speciesCounts = Pet::where('availability_status', true)
            ->select('species')
            ->selectRaw('count(*) as count')
            ->groupBy('species')
            ->get()
            ->pluck('count', 'species');

        $breedCounts = Pet::where('availability_status', true)
            ->select('breed')
            ->selectRaw('count(*) as count')
            ->groupBy('breed')
            ->orderByDesc('count')
            ->limit(10)
            ->get()
            ->pluck('count', 'breed');

        return response()->json([
            'available_pets' => $availableCount,
            'total_pets' => $totalCount,
            'by_species' => $speciesCounts,
            'top_breeds' => $breedCounts,
        ]);
    }

    /**
     * Parse comma-separated values into array
     */
    private function parseCommaSeparated(string $value): array
    {
        return array_filter(
            array_map('trim', explode(',', $value)),
            fn($item) => !empty($item)
        );
    }
}
