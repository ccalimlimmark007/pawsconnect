<?php

use App\Http\Controllers\AdopterProfileController;
use App\Http\Controllers\AdoptionApplicationController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\Api\ShelterAvailabilityController;
use App\Http\Controllers\ApplicationDocumentController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HomeVisitController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\PetImageController;
use App\Http\Controllers\PostPetController;
use App\Http\Controllers\ShelterVisitController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\UserProfileController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ── Public Pages ──────────────────────────────────────────────────────────────

Route::get('/', fn () => Inertia::render('Home'))->name('home');
Route::get('/about', fn () => Inertia::render('About'))->name('about');
Route::get('/quiz', fn () => Inertia::render('Quiz'))->name('quiz');
Route::get('/matches', fn (Request $request) => Inertia::render('Matches', [
    'results' => $request->query('results'),
]))->name('matches');

// Pet browsing
Route::get('/pets', [PetController::class, 'index'])->name('pets.index');
Route::get('/pets/{id}', [PetController::class, 'show'])->name('pets.show');

// Application form (public page — submit requires auth)
Route::get('/apply', [AdoptionApplicationController::class, 'applyForm'])->name('pets.apply');

// Auth fallback (Fortify handles the real login route)
Route::get('/login', fn () => Inertia::render('auth/login'))->name('login');
Route::get('/auth', fn () => redirect()->route('login'))->name('auth.redirect');

// ── Signed Downloads (URL signature provides auth) ────────────────────────────

Route::get('/documents/{document}/download', [ApplicationDocumentController::class, 'download'])
    ->name('documents.download');

// ── Shelter Visit Availability (public read) ──────────────────────────────────

Route::prefix('api')->group(function () {
    Route::get('/shelter-visits/available-slots', [ShelterAvailabilityController::class, 'availableSlots'])
        ->name('api.shelter-visits.available-slots');
    Route::get('/shelter-visits/booked-dates', [ShelterAvailabilityController::class, 'bookedDates'])
        ->name('api.shelter-visits.booked-dates');

    // Public pet API (used by the filter UI)
    Route::get('/pets', [\App\Http\Controllers\Api\PetFilterController::class, 'index'])->name('api.pets.index');
    Route::get('/pets/stats', [\App\Http\Controllers\Api\PetFilterController::class, 'stats'])->name('api.pets.stats');
});

// ── Authenticated Routes ───────────────────────────────────────────────────────

Route::middleware(['auth'])->group(function () {

    // Dashboard — redirects to role-appropriate view
    Route::get('/dashboard', function () {
        $user = auth()->user();
        if ($user?->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }
        if ($user?->isShelterStaff()) {
            return redirect()->route('staff.dashboard');
        }
        return Inertia::render('dashboard');
    })->name('dashboard');

    // User profile dashboard
    Route::get('/profile', [UserProfileController::class, 'index'])->name('profile');

    // Favorites (JSON API + page)
    Route::prefix('api')->group(function () {
        Route::get('/favorites', [FavoriteController::class, 'index'])->name('favorites.index');
        Route::post('/favorites/toggle', [FavoriteController::class, 'toggle'])
            ->middleware('throttle:favorites')
            ->name('favorites.toggle');

        // Authenticated pet management (session-based web users)
        Route::get('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'show'])->name('api.pets.show');
        Route::middleware('role:shelter_staff,admin')->group(function () {
            Route::patch('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'update'])
                ->withoutMiddleware('VerifyCsrfToken')
                ->name('api.pets.update');
            Route::delete('/pets/{id}', [\App\Http\Controllers\Api\PetController::class, 'destroy'])
                ->withoutMiddleware('VerifyCsrfToken')
                ->name('api.pets.destroy');
            Route::post('/pets/{id}/delete', [\App\Http\Controllers\Api\PetController::class, 'destroy'])
                ->withoutMiddleware('VerifyCsrfToken')
                ->name('api.pets.destroy.post');
        });
    });

    // ── Adopter-only ──────────────────────────────────────────────────────────

    Route::middleware('role:adopter')->group(function () {
        Route::get('/my-favorites', [FavoriteController::class, 'page'])->name('my-favorites');
        Route::get('/my-applications', [AdoptionApplicationController::class, 'myApplications'])->name('pets.my-applications');
        Route::post('/apply/submit', [AdoptionApplicationController::class, 'submit'])
            ->middleware('throttle:applications')
            ->name('pets.apply.submit');
        Route::post('/apply/start', [AdoptionApplicationController::class, 'start'])->name('pets.apply.start');
        Route::post('/my-applications/{application}/documents', [ApplicationDocumentController::class, 'store'])
            ->name('documents.adopter-store');

        // Adopter preference profile
        Route::get('/profile/preferences', [AdopterProfileController::class, 'edit'])->name('profile.preferences');
        Route::put('/profile/preferences', [AdopterProfileController::class, 'update'])->name('profile.preferences.update');
    });

    // Shelter visit scheduling (adopters + staff)
    Route::post('/visits', [ShelterVisitController::class, 'store'])->name('visits.store');
    Route::delete('/visits/{visit}', [ShelterVisitController::class, 'destroy'])->name('visits.destroy');
    Route::get('/my-visits', [ShelterVisitController::class, 'index'])->name('visits.index');

    // ── Shelter Staff & Admin ─────────────────────────────────────────────────

    Route::middleware('role:shelter_staff,admin')->group(function () {
        // Pet posting
        Route::get('/post-pet', [PostPetController::class, 'create'])->name('pets.post');
        Route::post('/post-pet', [PostPetController::class, 'store'])
            ->middleware('throttle:pet-posting')
            ->name('pets.store');

        // Pet images
        Route::post('/pets/{pet}/images', [PetImageController::class, 'store'])->name('pet-images.store');
        Route::delete('/pet-images/{image}', [PetImageController::class, 'destroy'])->name('pet-images.destroy');
        Route::patch('/pet-images/{image}/primary', [PetImageController::class, 'setPrimary'])->name('pet-images.set-primary');
        Route::post('/pets/{pet}/images/reorder', [PetImageController::class, 'reorder'])->name('pet-images.reorder');

        // Adoption application management
        Route::get('/admin/applications', [AdoptionApplicationController::class, 'index'])->name('admin.applications');
        Route::patch('/admin/applications/{id}', [AdoptionApplicationController::class, 'updateStatus'])->name('admin.applications.update');

        // Home visits
        Route::post('/admin/applications/{application}/visit', [HomeVisitController::class, 'store'])->name('admin.visits.store');
        Route::patch('/admin/visits/{visit}', [HomeVisitController::class, 'update'])->name('admin.visits.update');
        Route::delete('/admin/visits/{visit}', [HomeVisitController::class, 'destroy'])->name('admin.visits.destroy');

        // Shelter visit management
        Route::patch('/admin/shelter-visits/{visit}/confirm', [ShelterVisitController::class, 'confirm'])->name('admin.shelter-visits.confirm');
        Route::patch('/admin/shelter-visits/{visit}/decline', [ShelterVisitController::class, 'decline'])->name('admin.shelter-visits.decline');

        // Documents
        Route::get('/admin/documents/{document}/signed-url', [ApplicationDocumentController::class, 'signedUrl'])->name('documents.signed-url');
        Route::delete('/admin/documents/{document}', [ApplicationDocumentController::class, 'destroy'])->name('documents.destroy');

        // Staff dashboard
        Route::get('/staff/dashboard', [StaffController::class, 'dashboard'])->name('staff.dashboard');
    });

    // ── Admin-only ────────────────────────────────────────────────────────────

    Route::middleware('role:admin')->group(function () {
        Route::get('/admin', [AdminController::class, 'index'])->name('admin.dashboard');
        Route::get('/admin/analytics', [AdminController::class, 'analytics'])->name('admin.analytics');
        Route::get('/admin/users', [AdminController::class, 'users'])->name('admin.users');
        Route::get('/admin/trash', [AdminController::class, 'trash'])->name('admin.trash');
        Route::get('/admin/activity', [AdminController::class, 'activityLog'])->name('admin.activity');
        Route::patch('/admin/trash/{type}/{id}/restore', [AdminController::class, 'restore'])->name('admin.trash.restore');
        Route::delete('/admin/trash/{type}/{id}', [AdminController::class, 'forceDelete'])->name('admin.trash.force-delete');
        Route::patch('/admin/users/{id}/role', [AdminController::class, 'updateUserRole'])->name('admin.users.role');
        Route::delete('/admin/users/{id}', [AdminController::class, 'destroyUser'])->name('admin.users.destroy');
    });
});
