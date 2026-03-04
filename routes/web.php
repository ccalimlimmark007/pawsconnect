<?php
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// --- Public Pages ---
Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::get('/pets', function () {
    return Inertia::render('Pets/Index');
})->name('pets.index');

// Pet detail page
Route::get('/pets/{id}', function ($id) {
    return Inertia::render('Pets/Show', [
        'petId' => $id,
    ]);
})->name('pets.show');

// Apply form page
Route::get('/apply', function (Request $request) {
    return Inertia::render('Pets/Apply', [
        'pet' => $request->query('pet'),
    ]);
})->name('pets.apply');

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

// --- Protected Routes ---
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/profile', function () {
        return Inertia::render('Profile', [
            'status' => session('status'),
        ]);
    })->name('profile');
});

// Favorites API for authenticated users (JSON only, no Inertia middleware)
Route::middleware(['auth'])->withoutMiddleware([HandleInertiaRequests::class])->group(function () {
    Route::get('/favorites', [\App\Http\Controllers\FavoriteController::class, 'index'])->name('favorites.index');
    Route::post('/favorites/toggle', [\App\Http\Controllers\FavoriteController::class, 'toggle'])->name('favorites.toggle');
});