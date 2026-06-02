<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Http\Controllers\ApplicationDocumentController;
use App\Models\AdoptionApplication;
use App\Models\User;
use App\Notifications\ApplicationApproved;
use App\Notifications\ApplicationRejected;
use App\Notifications\ApplicationSubmitted;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AdoptionApplicationController extends Controller
{
    /**
     * List applications — shelter staff see only their pets' applications,
     * admins see all.
     */
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $query = AdoptionApplication::with([
                'user:id,name,email',
                'pet:id,name,species',
                'reviewer:id,name',
                'homeVisit.assignedStaff:id,name',
                'documents',
            ])
            ->orderBy('created_at', 'desc');

        if ($user->isShelterStaff()) {
            $query->whereHas('pet', fn ($q) => $q->where('created_by', $user->id));
        }

        $applications = $query->get()->map(fn ($app) => [
            'id'                   => $app->id,
            'status'               => $app->status,
            'startedAt'            => optional($app->started_at)?->toDateString(),
            'createdAt'            => optional($app->created_at)?->toDateString(),
            'user'                 => $app->user
                ? ['id' => $app->user->id, 'name' => $app->user->name, 'email' => $app->user->email]
                : null,
            'pet'                  => $app->pet
                ? ['id' => (string) $app->pet->id, 'name' => $app->pet->name, 'species' => $app->pet->species]
                : null,
            // Questionnaire fields
            'homeType'             => $app->home_type,
            'hasYard'              => $app->has_yard,
            'hasChildren'          => $app->has_children,
            'hasOtherPets'         => $app->has_other_pets,
            'otherPetsDescription' => $app->other_pets_description,
            'workHoursPerDay'      => $app->work_hours_per_day,
            'reasonForAdopting'    => $app->reason_for_adopting,
            'priorPetExperience'   => $app->prior_pet_experience,
            'references'           => $app->references,
            // Review fields
            'notes'                => $app->notes,
            'rejectedReason'       => $app->rejected_reason,
            'reviewedBy'           => $app->reviewer?->name,
            'reviewedAt'           => optional($app->reviewed_at)?->toDateString(),
            // Documents
            'documents'            => $app->documents->map(fn ($doc) => [
                'id'           => $doc->id,
                'type'         => $doc->type,
                'originalName' => $doc->original_name,
                'uploadedAt'   => optional($doc->created_at)->toDateString(),
                'downloadUrl'  => route('documents.signed-url', $doc->id),
            ])->toArray(),
            // Home visit
            'homeVisit'            => $app->homeVisit ? [
                'id'                => $app->homeVisit->id,
                'visitDate'         => $app->homeVisit->visit_date->format('Y-m-d\TH:i'),
                'visitDateFormatted' => $app->homeVisit->visit_date->format('M j, Y g:i A'),
                'status'            => $app->homeVisit->status,
                'assignedStaffId'   => $app->homeVisit->assigned_staff_id,
                'assignedStaffName' => $app->homeVisit->assignedStaff?->name,
                'notes'             => $app->homeVisit->notes,
            ] : null,
        ]);

        $staffList = User::whereIn('role', [Role::ShelterStaff->value, Role::Admin->value])
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        return Inertia::render('Admin/Applications', [
            'applications' => $applications,
            'staffList'    => $staffList,
        ]);
    }

    /**
     * Show the authenticated adopter's own applications.
     */
    public function myApplications(Request $request): \Inertia\Response
    {
        $user = $request->user();

        $applications = AdoptionApplication::with([
                'pet:id,name,species,created_by',
                'pet.petImages',
                'reviewer:id,name',
                'homeVisit.assignedStaff:id,name',
            ])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($app) => [
                'id'             => $app->id,
                'status'         => $app->status,
                'startedAt'      => optional($app->started_at)?->toDateString(),
                'createdAt'      => optional($app->created_at)?->toDateString(),
                'reviewedAt'     => optional($app->reviewed_at)?->toDateString(),
                'pet'            => $app->pet ? [
                    'id'       => (string) $app->pet->id,
                    'name'     => $app->pet->name,
                    'species'  => $app->pet->species,
                    'imageUrl' => $app->pet->petImages->firstWhere('is_primary', true)?->url
                        ?? $app->pet->petImages->first()?->url,
                ] : null,
                'notes'          => $app->notes,
                'rejectedReason' => $app->rejected_reason,
                'reviewedBy'     => $app->reviewer?->name,
                'homeVisit'      => $app->homeVisit ? [
                    'visitDateFormatted' => $app->homeVisit->visit_date->format('M j, Y g:i A'),
                    'status'             => $app->homeVisit->status,
                    'assignedStaffName'  => $app->homeVisit->assignedStaff?->name,
                    'notes'              => $app->homeVisit->notes,
                ] : null,
            ]);

        return Inertia::render('Pets/MyApplications', ['applications' => $applications]);
    }

    /**
     * Submit a completed adoption questionnaire.
     * Creates the application (or updates an existing started one) and sets status → pending.
     */
    public function submit(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $validated = $request->validate([
            'pet_id'                  => ['required', 'string', 'max:255'],
            'home_type'               => ['required', 'in:house,apartment,condo'],
            'has_yard'                => ['required', 'boolean'],
            'has_children'            => ['required', 'boolean'],
            'has_other_pets'          => ['required', 'boolean'],
            'other_pets_description'  => ['nullable', 'string', 'max:1000', 'required_if:has_other_pets,true'],
            'work_hours_per_day'      => ['required', 'integer', 'min:0', 'max:24'],
            'reason_for_adopting'     => ['required', 'string', 'min:20', 'max:2000'],
            'prior_pet_experience'    => ['nullable', 'string', 'max:2000'],
            'references'              => ['required', 'array', 'min:1', 'max:3'],
            'references.*.name'       => ['required', 'string', 'max:255'],
            'references.*.relationship' => ['required', 'string', 'max:100'],
            'references.*.contact'    => ['required', 'string', 'max:255'],
            // Documents — optional, max 5 files, 5 MB each
            'documents'               => ['nullable', 'array', 'max:5'],
            'documents.*'             => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'document_types'          => ['nullable', 'array'],
            'document_types.*'        => ['nullable', 'string', 'in:government_id,proof_of_income,reference_letter,other'],
        ]);

        $petId = (string) $validated['pet_id'];

        // Block duplicate submissions: pending or approved application already exists
        $duplicate = AdoptionApplication::where('user_id', $user->id)
            ->where('pet_id', $petId)
            ->whereIn('status', ['pending', 'approved'])
            ->whereNull('deleted_at')
            ->first();

        if ($duplicate) {
            return back()
                ->withErrors([
                    'pet_id' => "You already have a {$duplicate->status} application for this pet. "
                        . 'Visit "My Applications" to track its progress.',
                ])
                ->withInput();
        }

        $data = [
            'status'                 => 'pending',
            'dedup_key'              => $petId,
            'started_at'             => now(),
            'home_type'              => $validated['home_type'],
            'has_yard'               => $validated['has_yard'],
            'has_children'           => $validated['has_children'],
            'has_other_pets'         => $validated['has_other_pets'],
            'other_pets_description' => $validated['other_pets_description'] ?? null,
            'work_hours_per_day'     => $validated['work_hours_per_day'],
            'reason_for_adopting'    => $validated['reason_for_adopting'],
            'prior_pet_experience'   => $validated['prior_pet_experience'] ?? null,
            'references'             => $validated['references'],
        ];

        // Update an existing 'started' application, or create a fresh one
        $existing = AdoptionApplication::where('user_id', $user->id)
            ->where('pet_id', $petId)
            ->where('status', 'started')
            ->whereNull('deleted_at')
            ->first();

        if ($existing) {
            $existing->update($data);
            $application = $existing;
        } else {
            $application = AdoptionApplication::create(
                array_merge(['user_id' => $user->id, 'pet_id' => $petId], $data)
            );
        }

        if ($request->hasFile('documents')) {
            ApplicationDocumentController::persistDocuments(
                $application,
                $request->file('documents'),
                $request->input('document_types', []),
            );
        }

        // Notify all shelter staff and admins about the new application
        $application->load('pet', 'user');
        $staff = User::whereIn('role', [Role::ShelterStaff->value, Role::Admin->value])->get();
        Notification::send($staff, new ApplicationSubmitted($application));

        return redirect()->route('pets.index')
            ->with('status', 'Your application has been submitted! We\'ll be in touch soon.');
    }

    /**
     * Update the status of an adoption application, optionally recording
     * review notes and a rejection reason.
     */
    public function updateStatus(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'status'           => ['required', 'string', 'in:started,pending,approved,rejected'],
            'notes'            => ['nullable', 'string', 'max:2000'],
            'rejected_reason'  => ['nullable', 'string', 'max:2000',
                                   'required_if:status,rejected'],
        ]);

        $user        = $request->user();
        $application = AdoptionApplication::findOrFail($id);

        if ($user->isShelterStaff() && (int) optional($application->pet)->created_by !== (int) $user->id) {
            abort(403);
        }

        $oldStatus = $application->status;
        $fields = [
            'status'    => $validated['status'],
            // Keep dedup_key in sync: NULL for rejected (allows re-application),
            // pet_id for every other status (enforces the partial unique constraint)
            'dedup_key' => $validated['status'] === 'rejected' ? null : $application->pet_id,
        ];

        if (isset($validated['notes'])) {
            $fields['notes'] = $validated['notes'];
        }

        if ($validated['status'] === 'rejected') {
            $fields['rejected_reason'] = $validated['rejected_reason'] ?? null;
        }

        if (in_array($validated['status'], ['approved', 'rejected'], true)) {
            $fields['reviewed_by'] = $user->id;
            $fields['reviewed_at'] = now();
        }

        $application->update($fields);

        if ($oldStatus !== $validated['status']) {
            activity('applications')
                ->performedOn($application)
                ->causedBy($user)
                ->withProperties([
                    'old_status' => $oldStatus,
                    'new_status' => $validated['status'],
                    'pet_name'   => $application->pet?->name,
                ])
                ->log("Application status changed from {$oldStatus} to {$validated['status']}");

            // Notify the applicant when their application is approved or rejected
            $application->load('pet', 'user');
            if ($validated['status'] === 'approved' && $application->user) {
                $application->user->notify(new ApplicationApproved($application));
            } elseif ($validated['status'] === 'rejected' && $application->user) {
                $application->user->notify(new ApplicationRejected($application));
            }
        }

        return redirect()->back()->with('status', 'Application updated.');
    }

    /**
     * Create a minimal "started" application (legacy — used by old flow).
     */
    public function start(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        $petId = (string) $validated['pet_id'];

        // Find any existing non-rejected application (don't re-use rejected records)
        $application = AdoptionApplication::where('user_id', $user->id)
            ->where('pet_id', $petId)
            ->where('status', '!=', 'rejected')
            ->whereNull('deleted_at')
            ->first();

        if (! $application) {
            $application = AdoptionApplication::create([
                'user_id'    => $user->id,
                'pet_id'     => $petId,
                'dedup_key'  => $petId,
                'status'     => 'started',
                'started_at' => now(),
            ]);
        } elseif (! $application->started_at) {
            $application->update(['started_at' => now()]);
        }

        return back();
    }

    public function applyForm(Request $request): InertiaResponse
    {
        $petId = $request->query('pet');
        $pet   = $petId ? \App\Models\Pet::with(['shelter', 'petImages'])->find($petId) : null;

        return Inertia::render('Pets/Apply', [
            'petId' => $petId,
            'pet'   => $pet ? [
                'id'          => (string) $pet->id,
                'name'        => $pet->name,
                'species'     => $pet->species,
                'breed'       => $pet->breed,
                'imageUrl'    => $pet->petImages->firstWhere('is_primary', true)?->url
                    ?? $pet->petImages->first()?->url,
                'shelterName' => $pet->shelter?->name,
            ] : null,
        ]);
    }
}
