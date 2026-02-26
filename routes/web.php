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




// --- Auth Pages (Simple Render) ---
// We use simple functions here because the Controllers are missing
// --- Auth Pages (Matching your lowercase files) ---
Route::get('/login', function () {
    return Inertia::render('auth/login'); // Changed from 'Auth/Login'
})->name('login');

Route::get('/register', function () {
    return Inertia::render('auth/register'); // Changed from 'Auth/Register'
})->name('register');

// A placeholder logout route to prevent errors in the Navbar
Route::post('/logout', function () {
    return redirect('/');
})->name('logout');