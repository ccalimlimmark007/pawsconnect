<?php

use App\Http\Controllers\Api\V1\ApplicationController;
use App\Http\Controllers\Api\V1\PetController;
use App\Http\Controllers\Api\V1\ShelterController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| PawsConnect REST API — v1
|--------------------------------------------------------------------------
|
| All routes here are prefixed with /api automatically by the framework.
| Token authentication uses Laravel Sanctum (Bearer token in Authorization header).
|
*/

Route::prefix('v1')->name('api.v1.')->group(function () {

    // --- Public endpoints (no auth required) ---

    Route::get('pets', [PetController::class, 'index'])->name('pets.index');
    Route::get('pets/{pet}', [PetController::class, 'show'])->name('pets.show');

    Route::get('shelters', [ShelterController::class, 'index'])->name('shelters.index');
    Route::get('shelters/{shelter}', [ShelterController::class, 'show'])->name('shelters.show');

    // --- Authenticated endpoints (Bearer token required) ---

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('user', [UserController::class, 'me'])->name('user.me');

        Route::get('applications', [ApplicationController::class, 'index'])->name('applications.index');
        Route::get('applications/{application}', [ApplicationController::class, 'show'])->name('applications.show');
        Route::post('applications', [ApplicationController::class, 'store'])->name('applications.store');
    });
});
