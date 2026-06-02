<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdopterProfileController extends Controller
{
    public function edit(): Response
    {
        $profile = auth()->user()->adopterProfile;

        return Inertia::render('Profile/Preferences', [
            'profile' => $profile ? [
                'home_type'         => $profile->home_type,
                'has_yard'          => $profile->has_yard,
                'activity_level'    => $profile->activity_level,
                'experience_level'  => $profile->experience_level,
                'preferred_species' => $profile->preferred_species ?? [],
                'preferred_size'    => $profile->preferred_size ?? [],
            ] : null,
            'status' => session('status'),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'home_type'           => ['nullable', 'string', 'in:apartment,house,farm,other'],
            'has_yard'            => ['nullable', 'boolean'],
            'activity_level'      => ['nullable', 'string', 'in:low,moderate,high'],
            'experience_level'    => ['nullable', 'string', 'in:first_time,some_experience,experienced'],
            'preferred_species'   => ['nullable', 'array'],
            'preferred_species.*' => ['string', 'in:Dog,Cat,Rabbit,Bird,Other'],
            'preferred_size'      => ['nullable', 'array'],
            'preferred_size.*'    => ['string', 'in:Small,Medium,Large,Extra Large'],
        ]);

        auth()->user()->adopterProfile()->updateOrCreate(
            ['user_id' => auth()->id()],
            $validated
        );

        return redirect()->route('profile.preferences')
            ->with('status', 'Your adoption preferences have been saved!');
    }
}
