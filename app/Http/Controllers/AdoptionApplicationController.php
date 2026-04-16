<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AdoptionApplicationController extends Controller
{
    public function start(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $application = AdoptionApplication::firstOrCreate(
            [
                'user_id' => $user->id,
                'pet_id' => (string) $validated['pet_id'],
            ],
            [
                'status' => 'started',
                'started_at' => now(),
            ]
        );

        if (! $application->started_at) {
            $application->started_at = now();
            $application->save();
        }

        return back();
    }
}
