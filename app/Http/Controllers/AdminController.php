<?php

namespace App\Http\Controllers;

use App\Models\AdoptionApplication;
use App\Models\Pet;
use App\Models\Shelter;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class AdminController extends Controller
{
    public function index(): Response
    {
        $stats = [
            'totalPets'     => Pet::count(),
            'totalUsers'    => User::count(),
            'totalShelters' => Shelter::count(),
            'totalApplications' => AdoptionApplication::count(),
            'trashedPets'   => Pet::onlyTrashed()->count(),
            'trashedShelters' => Shelter::onlyTrashed()->count(),
            'trashedApplications' => AdoptionApplication::onlyTrashed()->count(),
        ];

        return Inertia::render('Admin/Dashboard', ['stats' => $stats]);
    }

    public function analytics(Request $request): Response
    {
        $from  = $request->input('from');
        $to    = $request->input('to');
        $toEnd = $to ? "{$to} 23:59:59" : null;

        // 1. Pets by species (within date range)
        $petsBySpecies = Pet::selectRaw('species, COUNT(*) as count')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('created_at', '<=', $toEnd))
            ->groupBy('species')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($r) => ['species' => ucfirst((string) $r->species), 'count' => (int) $r->count]);

        // 2. Application status breakdown
        $applicationsByStatus = AdoptionApplication::selectRaw('status, COUNT(*) as count')
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('created_at', '<=', $toEnd))
            ->groupBy('status')
            ->get()
            ->map(fn ($r) => ['status' => (string) $r->status, 'count' => (int) $r->count]);

        // 3. Approval rate (scoped to reviewed_at date)
        $totalDecided = AdoptionApplication::whereIn('status', ['approved', 'rejected'])
            ->when($from, fn ($q) => $q->where('reviewed_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('reviewed_at', '<=', $toEnd))
            ->count();

        $totalApproved = AdoptionApplication::where('status', 'approved')
            ->when($from, fn ($q) => $q->where('reviewed_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('reviewed_at', '<=', $toEnd))
            ->count();

        $approvalRate = $totalDecided > 0 ? round($totalApproved / $totalDecided * 100, 1) : null;

        // 4. Average days from started_at → reviewed_at (collection-level for DB portability)
        $avgDays = AdoptionApplication::whereNotNull('reviewed_at')
            ->whereNotNull('started_at')
            ->when($from, fn ($q) => $q->where('reviewed_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('reviewed_at', '<=', $toEnd))
            ->get(['started_at', 'reviewed_at'])
            ->average(fn ($a) => $a->started_at->diffInDays($a->reviewed_at));

        // 5. Top 5 shelters by approved adoptions
        $topShelters = DB::table('shelters')
            ->join('pets', 'pets.shelter_id', '=', 'shelters.id')
            ->join('adoption_applications', 'adoption_applications.pet_id', '=', 'pets.id')
            ->where('adoption_applications.status', 'approved')
            ->whereNull('shelters.deleted_at')
            ->whereNull('pets.deleted_at')
            ->whereNull('adoption_applications.deleted_at')
            ->when($from, fn ($q) => $q->where('adoption_applications.reviewed_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('adoption_applications.reviewed_at', '<=', $toEnd))
            ->select('shelters.name', DB::raw('COUNT(adoption_applications.id) as count'))
            ->groupBy('shelters.id', 'shelters.name')
            ->orderByDesc('count')
            ->limit(5)
            ->get();

        // 6. New user registrations over time (SQLite: strftime; swap for DATE_FORMAT on MySQL)
        $registrations = User::selectRaw("strftime('%Y-%m-%d', created_at) as date, COUNT(*) as count")
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('created_at', '<=', $toEnd))
            ->groupByRaw("strftime('%Y-%m-%d', created_at)")
            ->orderBy('date')
            ->get()
            ->map(fn ($r) => ['date' => $r->date, 'count' => (int) $r->count]);

        // Active applications (status=started|pending, scoped by created_at)
        $activeApplications = AdoptionApplication::whereIn('status', ['started', 'pending'])
            ->when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('created_at', '<=', $toEnd))
            ->count();

        $totalPets = Pet::when($from, fn ($q) => $q->where('created_at', '>=', $from))
            ->when($toEnd, fn ($q) => $q->where('created_at', '<=', $toEnd))
            ->count();

        return Inertia::render('Admin/Analytics', [
            'petsBySpecies'        => $petsBySpecies,
            'applicationsByStatus' => $applicationsByStatus,
            'approvalRate'         => $approvalRate,
            'avgDaysToDecision'    => $avgDays !== null ? round((float) $avgDays, 1) : null,
            'topShelters'          => $topShelters,
            'registrations'        => $registrations,
            'activeApplications'   => $activeApplications,
            'totalDecided'         => $totalDecided,
            'totalPets'            => $totalPets,
            'filters'              => ['from' => $from ?? '', 'to' => $to ?? ''],
        ]);
    }

    public function users(): Response
    {
        $users = User::select('id', 'name', 'email', 'role', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role->value,
                'roleLabel' => $u->role->label(),
                'createdAt' => $u->created_at->toDateString(),
            ]);

        return Inertia::render('Admin/Users', ['users' => $users]);
    }

    public function trash(): Response
    {
        $pets = Pet::onlyTrashed()
            ->with('shelter')
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'species' => $p->species,
                'shelterName' => $p->shelter?->name,
                'deletedAt' => $p->deleted_at->toDateString(),
            ]);

        $shelters = Shelter::onlyTrashed()
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'deletedAt' => $s->deleted_at->toDateString(),
            ]);

        $applications = AdoptionApplication::onlyTrashed()
            ->with(['user:id,name', 'pet:id,name'])
            ->orderBy('deleted_at', 'desc')
            ->get()
            ->map(fn ($a) => [
                'id' => $a->id,
                'status' => $a->status,
                'userName' => $a->user?->name,
                'petName' => $a->pet?->name,
                'deletedAt' => $a->deleted_at->toDateString(),
            ]);

        return Inertia::render('Admin/Trash', [
            'trashed' => [
                'pets' => $pets,
                'shelters' => $shelters,
                'applications' => $applications,
            ],
        ]);
    }

    public function restore(string $type, int $id): RedirectResponse
    {
        match ($type) {
            'pet' => $this->restorePet($id),
            'shelter' => Shelter::withTrashed()->findOrFail($id)->restore(),
            'application' => AdoptionApplication::withTrashed()->findOrFail($id)->restore(),
            default => abort(404),
        };

        return back()->with('status', ucfirst($type) . ' restored successfully.');
    }

    public function forceDelete(string $type, int $id): RedirectResponse
    {
        match ($type) {
            'pet' => $this->forceDeletePet($id),
            'shelter' => Shelter::withTrashed()->findOrFail($id)->forceDelete(),
            'application' => AdoptionApplication::withTrashed()->findOrFail($id)->forceDelete(),
            default => abort(404),
        };

        return back()->with('status', ucfirst($type) . ' permanently deleted.');
    }

    public function activityLog(Request $request): Response
    {
        $subjectFilter = $request->input('subject');
        $causerFilter  = $request->input('causer');

        $query = Activity::with(['causer', 'subject'])
            ->orderBy('created_at', 'desc');

        if ($subjectFilter) {
            $query->where('subject_type', 'LIKE', "%{$subjectFilter}%");
        }

        if ($causerFilter) {
            $query->whereHasMorph('causer', [User::class], function ($q) use ($causerFilter) {
                $q->where('name', 'LIKE', "%{$causerFilter}%")
                  ->orWhere('email', 'LIKE', "%{$causerFilter}%");
            });
        }

        $paginator = $query->paginate(50)->withQueryString();

        $activities = $paginator->getCollection()->map(fn (Activity $activity) => [
            'id'           => $activity->id,
            'logName'      => $activity->log_name,
            'description'  => $activity->description,
            'event'        => $activity->event,
            'subjectType'  => $activity->subject_type ? class_basename($activity->subject_type) : null,
            'subjectId'    => $activity->subject_id,
            'subjectLabel' => $this->subjectLabel($activity),
            'causerName'   => $activity->causer?->name ?? 'System',
            'causerEmail'  => $activity->causer?->email,
            'properties'   => $activity->properties->toArray(),
            'createdAt'    => $activity->created_at->format('Y-m-d H:i:s'),
        ]);

        return Inertia::render('Admin/ActivityLog', [
            'activities' => $activities,
            'pagination' => [
                'total'        => $paginator->total(),
                'per_page'     => $paginator->perPage(),
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
            ],
            'filters' => [
                'subject' => $request->input('subject', ''),
                'causer'  => $request->input('causer', ''),
            ],
        ]);
    }

    public function updateUserRole(Request $request, int $id): RedirectResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:adopter,shelter_staff,admin'],
        ]);

        $target = User::findOrFail($id);

        if ($target->id === $request->user()->id) {
            return back()->withErrors(['role' => 'You cannot change your own role.']);
        }

        $oldRole = $target->role->value;
        $target->update(['role' => $validated['role']]);

        activity('users')
            ->performedOn($target)
            ->causedBy($request->user())
            ->withProperties(['old_role' => $oldRole, 'new_role' => $validated['role']])
            ->log("User role changed from {$oldRole} to {$validated['role']}");

        return back()->with('status', "Role updated for {$target->name}.");
    }

    public function destroyUser(Request $request, int $id): RedirectResponse
    {
        $target = User::findOrFail($id);

        if ($target->id === $request->user()->id) {
            return back()->withErrors(['error' => 'You cannot delete your own account.']);
        }

        activity('users')
            ->causedBy($request->user())
            ->withProperties(['deleted_name' => $target->name, 'deleted_email' => $target->email])
            ->log("User account deleted: {$target->email}");

        $target->delete();

        return back()->with('status', "User {$target->name} has been deleted.");
    }

    private function subjectLabel(Activity $activity): ?string
    {
        if (! $activity->subject) {
            return $activity->subject_id ? "#{$activity->subject_id}" : null;
        }

        return match (true) {
            $activity->subject instanceof Pet                 => $activity->subject->name,
            $activity->subject instanceof AdoptionApplication => "Application #{$activity->subject->id}",
            $activity->subject instanceof Shelter             => $activity->subject->name,
            $activity->subject instanceof User               => $activity->subject->name,
            default                                           => "#{$activity->subject_id}",
        };
    }

    private function restorePet(int $id): void
    {
        $pet = Pet::withTrashed()->findOrFail($id);
        $pet->restore();
        // Restore medical records that were soft-deleted alongside the pet
        $pet->medicalRecords()->onlyTrashed()->restore();
    }

    private function forceDeletePet(int $id): void
    {
        $pet = Pet::withTrashed()->findOrFail($id);

        if ($pet->image_url && str_starts_with($pet->image_url, '/storage/')) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $pet->image_url));
        }

        // Force-delete cascades to medical_records via FK on delete
        $pet->forceDelete();
    }
}
