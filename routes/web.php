<?php
use App\Http\Controllers\AdoptionApplicationController;
use App\Http\Controllers\PostPetController;
use App\Models\Pet;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// --- Public Pages ---
Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::get('/pets', function () {
    $pets = Pet::with(['shelterContact', 'medicalRecords'])
        ->where('availability_status', true)
        ->orderBy('created_at', 'desc')
        ->get()
        ->map(function ($pet) {
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
                'medicalHistory' => $pet->medicalRecords->map(fn ($record) => [
                    'title' => $record->type,
                    'note' => $record->notes ?: $record->description,
                    'date' => optional($record->record_date)?->toDateString() ?: optional($record->created_at)?->toDateString(),
                ])->values()->toArray(),
            ];
        });

    return Inertia::render('Pets/Index', [
        'pets' => $pets,
    ]);
})->name('pets.index');

// Pet detail page
Route::get('/pets/{id}', function ($id) {
    $dbPet = Pet::with(['shelterContact', 'medicalRecords'])->find($id);

    if ($dbPet) {
        return Inertia::render('Pets/Show', [
            'petId' => (string) $id,
            'pet' => [
                'id' => (string) $dbPet->id,
                'name' => $dbPet->name,
                'species' => $dbPet->species,
                'breed' => $dbPet->breed,
                'age' => $dbPet->age,
                'ageUnit' => $dbPet->age_unit,
                'gender' => $dbPet->gender,
                'size' => $dbPet->size,
                'temperamentTags' => $dbPet->temperament_tags ?? [],
                'medicalStatus' => $dbPet->medical_status,
                'description' => $dbPet->description,
                'imageUrl' => $dbPet->image_url,
                'shelterName' => $dbPet->shelter_name,
                'adoptionFee' => (float) $dbPet->adoption_fee,
                'dateAdded' => optional($dbPet->created_at)?->toDateString(),
                'medicalHistory' => $dbPet->medicalRecords->map(fn ($record) => [
                    'title' => $record->type,
                    'note' => $record->notes ?: $record->description,
                    'date' => optional($record->record_date)?->toDateString() ?: optional($record->created_at)?->toDateString(),
                ])->values(),
                'shelterContact' => $dbPet->shelterContact ? [
                    'phone' => $dbPet->shelterContact->phone,
                    'email' => $dbPet->shelterContact->email,
                    'address' => $dbPet->shelterContact->address,
                    'hours' => $dbPet->shelterContact->hours,
                ] : null,
            ],
        ]);
    }

    return Inertia::render('Pets/Show', [
        'petId' => $id,
    ]);
})->name('pets.show');

Route::middleware('auth')->group(function () {
    Route::get('/post-pet', [PostPetController::class, 'create'])->name('pets.post');
    Route::post('/post-pet', [PostPetController::class, 'store'])->name('pets.store');
});

// Apply form page
Route::get('/apply', function (Request $request) {
    return Inertia::render('Pets/Apply', [
        'pet' => $request->query('pet'),
    ]);
})->name('pets.apply');

Route::post('/apply/start', [AdoptionApplicationController::class, 'start'])
    ->middleware('auth')
    ->name('pets.apply.start');

// 1. The Quiz Page
Route::get('/quiz', function () {
    return Inertia::render('Quiz'); 
})->name('quiz');

// 2. The Results Page (where the quiz sends you after)
Route::get('/matches', function (Request $request) {
    return Inertia::render('Matches', [
        // This picks up the results sent from the Quiz
        'results' => $request->query('results') 
    ]);
})->name('matches');

Route::get('/about', function () {
    return Inertia::render('About');
})->name('about');


// --- Auth Pages ---
// Fortify handles authentication routes automatically (login, register, logout, etc.)
// These routes are configured in app/Providers/FortifyServiceProvider.php

// If the Fortify controllers/pages are not available, provide a simple
// fallback route that renders the login page directly.
Route::get('/login', function () {
    return Inertia::render('auth/login');
})->name('login');

Route::get('/auth', function () {
    return redirect()->route('login');
})->name('auth.redirect');

// --- Protected Routes ---
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/profile', function () {
        $user = auth()->user();
        $userPets = [];
        
        if ($user) {
            $userPets = Pet::where('created_by', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($pet) {
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
                        'availabilityStatus' => $pet->availability_status,
                        'description' => $pet->description,
                        'imageUrl' => $pet->image_url,
                        'shelterName' => $pet->shelter_name,
                        'adoptionFee' => (float) $pet->adoption_fee,
                        'datePosted' => optional($pet->created_at)?->toDateString(),
                    ];
                })->toArray();
        }
        
        return Inertia::render('Profile', [
            'status' => session('status'),
            'userPets' => $userPets,
        ]);
    })->name('profile');
});

// Favorites API (JSON only)
Route::prefix('api')->group(function () {
    Route::get('/favorites', [\App\Http\Controllers\FavoriteController::class, 'index'])->name('favorites.index');
    Route::post('/favorites/toggle', [\App\Http\Controllers\FavoriteController::class, 'toggle'])->withoutMiddleware('VerifyCsrfToken')->name('favorites.toggle');
    
    // Pet filtering and search API
    Route::get('/pets', [\App\Http\Controllers\Api\PetFilterController::class, 'index'])->name('api.pets.index');
    Route::get('/pets/stats', [\App\Http\Controllers\Api\PetFilterController::class, 'stats'])->name('api.pets.stats');
    
    // Authenticated pet management API for session-based web users
    Route::middleware('auth')->group(function () {
        Route::get('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'show'])->name('api.pets.show');
        Route::patch('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'update'])->withoutMiddleware('VerifyCsrfToken')->name('api.pets.update');
        Route::delete('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'destroy'])->withoutMiddleware('VerifyCsrfToken')->name('api.pets.destroy');
        Route::post('/pets/{id}/delete', [\App\Http\Controllers\Api\PetController::class, 'destroy'])->withoutMiddleware('VerifyCsrfToken')->name('api.pets.destroy.post');
    });
});