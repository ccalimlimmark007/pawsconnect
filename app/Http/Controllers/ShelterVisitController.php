<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShelterVisitRequest;
use App\Models\Pet;
use App\Models\ShelterVisit;
use App\Notifications\ShelterVisitScheduled;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ShelterVisitController extends Controller
{
    public function store(StoreShelterVisitRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // Resolve the slot duration from the shelter contact so it is captured
        // at booking time — independent of any future changes to the shelter setting.
        $pet      = Pet::with('shelter.shelterContact')->findOrFail($validated['pet_id']);
        $duration = (int) ($pet->shelter?->shelterContact?->slot_duration_minutes ?? 60);

        // Per-user duplicate: same user, same pet, same day.
        $userDuplicate = ShelterVisit::where('user_id', Auth::id())
            ->where('pet_id', $validated['pet_id'])
            ->where('visit_date', $validated['visit_date'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($userDuplicate) {
            return back()->withErrors([
                'visit_date' => 'You already have a visit scheduled for this pet on that date.',
            ]);
        }

        // Race-condition guard: slot may have been taken between FormRequest and now.
        $slotTaken = ShelterVisit::where('pet_id', $validated['pet_id'])
            ->where('visit_date', $validated['visit_date'])
            ->where('visit_time', $validated['visit_time'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($slotTaken) {
            return back()->withErrors([
                'visit_time' => 'This time slot was just taken. Please choose a different time.',
            ]);
        }

        $visit = ShelterVisit::create(array_merge($validated, [
            'user_id'               => Auth::id(),
            'visit_duration_minutes' => $duration,
        ]));

        $visit->load(['pet.shelter', 'user']);

        Auth::user()->notify(new ShelterVisitScheduled($visit));

        return redirect()->route('pets.show', $visit->pet_id)
            ->with('success', 'Your visit has been scheduled! The shelter will confirm shortly.');
    }

    public function destroy(ShelterVisit $visit): RedirectResponse
    {
        if ($visit->user_id !== Auth::id()) {
            abort(403);
        }

        if (! in_array($visit->status, ['pending', 'confirmed'], true)) {
            return back()->withErrors([
                'status' => 'This visit cannot be cancelled.',
            ]);
        }

        $visit->update([
            'status'       => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Your visit has been cancelled.');
    }

    public function confirm(ShelterVisit $visit): RedirectResponse
    {
        // Ensure shelter staff only confirm visits for pets at their shelter.
        $pet = $visit->pet()->with('shelter')->first();
        if (Auth::user()->role === 'shelter_staff' && $pet?->created_by !== Auth::id()) {
            abort(403);
        }

        if ($visit->status !== 'pending') {
            return back()->withErrors(['status' => 'Only pending visits can be confirmed.']);
        }

        $visit->update([
            'status'       => 'confirmed',
            'confirmed_at' => now(),
        ]);

        return back()->with('success', 'Visit confirmed.');
    }

    public function decline(ShelterVisit $visit): RedirectResponse
    {
        $pet = $visit->pet()->with('shelter')->first();
        if (Auth::user()->role === 'shelter_staff' && $pet?->created_by !== Auth::id()) {
            abort(403);
        }

        if (! in_array($visit->status, ['pending', 'confirmed'], true)) {
            return back()->withErrors(['status' => 'This visit cannot be declined.']);
        }

        $visit->update([
            'status'              => 'cancelled',
            'cancelled_at'        => now(),
            'cancellation_reason' => request()->input('reason'),
        ]);

        return back()->with('success', 'Visit declined.');
    }

    public function index(): Response
    {
        $visits = ShelterVisit::with(['pet.shelter', 'pet.petImages'])
            ->where('user_id', Auth::id())
            ->orderBy('visit_date', 'desc')
            ->paginate(10);

        return Inertia::render('Visits/Index', [
            'visits' => $visits,
        ]);
    }
}
