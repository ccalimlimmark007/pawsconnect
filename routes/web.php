<?php
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