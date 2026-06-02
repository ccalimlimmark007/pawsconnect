<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use App\Models\HomeVisit;
use App\Notifications\HomeVisitScheduled;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class HomeVisitController extends Controller
{
    public function store(Request $request, AdoptionApplication $application): RedirectResponse
    {
        $this->authorizeStaffAccess($request, $application);

        $validated = $request->validate([
            'visit_date'         => ['required', 'date', 'after:now'],
            'assigned_staff_id'  => ['nullable', 'exists:users,id'],
            'notes'              => ['nullable', 'string', 'max:2000'],
        ]);

        $visit = $application->homeVisit()->updateOrCreate(
            [],
            array_merge($validated, ['status' => 'scheduled']),
        );

        $visit->load('assignedStaff');

        if ($application->user) {
            $application->user->notify(new HomeVisitScheduled($visit));
        }

        return redirect()->back()->with('status', 'Home visit scheduled and applicant notified.');
    }

    public function update(Request $request, HomeVisit $visit): RedirectResponse
    {
        $this->authorizeStaffAccess($request, $visit->application);

        $validated = $request->validate([
            'visit_date'        => ['sometimes', 'date', 'after:now'],
            'status'            => ['sometimes', 'in:scheduled,completed,cancelled'],
            'assigned_staff_id' => ['nullable', 'exists:users,id'],
            'notes'             => ['nullable', 'string', 'max:2000'],
        ]);

        $visit->update($validated);

        return redirect()->back()->with('status', 'Home visit updated.');
    }

    public function destroy(HomeVisit $visit): RedirectResponse
    {
        $this->authorizeStaffAccess(request(), $visit->application);

        $visit->update(['status' => 'cancelled']);

        return redirect()->back()->with('status', 'Home visit cancelled.');
    }

    private function authorizeStaffAccess(Request $request, ?AdoptionApplication $application): void
    {
        $user = $request->user();

        if ($user->isShelterStaff() && $application) {
            $petCreatedBy = optional($application->pet)->created_by;
            if ((int) $petCreatedBy !== (int) $user->id) {
                abort(403);
            }
        }
    }
}
