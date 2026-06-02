<?php

namespace App\Http\Controllers;

use App\Enums\Role;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PostPetController extends Controller
{
    public function create(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/auth');
        }

        if (! $user->hasRole(Role::ShelterStaff, Role::Admin)) {
            abort(403, 'Only shelter staff and admins may post pets.');
        }

        $shelters = Shelter::orderBy('name')->get(['id', 'name']);

        return Inertia::render('PostPet', ['shelters' => $shelters]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect('/auth');
        }

        if (! $user->hasRole(Role::ShelterStaff, Role::Admin)) {
            abort(403, 'Only shelter staff and admins may post pets.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'species' => ['required', 'string', 'max:255'],
            'breed' => ['required', 'string', 'max:255'],
            'age' => ['required', 'integer', 'min:0'],
            'age_unit' => ['nullable', 'string', 'max:32'],
            'gender' => ['required', 'string', 'max:64'],
            'size' => ['required', 'string', 'max:64'],
            'color' => ['nullable', 'string', 'max:100'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'medical_status' => ['required', 'string', 'max:255'],
            'is_vetted' => ['nullable', 'boolean'],
            'availability_status' => ['nullable', 'boolean'],
            'adoption_fee' => ['required', 'numeric', 'min:0'],
            'shelter_name' => ['required', 'string', 'max:255'],
            'image'        => ['nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'description' => ['required', 'string'],

            'temperament_tags' => ['nullable', 'array'],
            'temperament_tags.*' => ['string', 'max:100'],
            'photos' => ['nullable', 'array'],
            'photos.*' => ['nullable', 'url', 'max:2048'],
            'personality_traits' => ['nullable', 'array'],
            'personality_traits.*' => ['string', 'max:100'],
            'good_with' => ['nullable', 'array'],
            'good_with.*' => ['string', 'max:100'],
            'not_good_with' => ['nullable', 'array'],
            'not_good_with.*' => ['string', 'max:100'],
            'special_needs' => ['nullable', 'string'],
            'dietary_needs' => ['nullable', 'string'],
            'exercise_requirements' => ['nullable', 'string'],

            'contact' => ['required', 'array'],
            'contact.name' => ['required', 'string', 'max:255'],
            'contact.phone' => ['required', 'string', 'max:100'],
            'contact.email' => ['required', 'email', 'max:255'],
            'contact.website' => ['nullable', 'url', 'max:2048'],
            'contact.address' => ['required', 'string', 'max:1000'],
            'contact.hours' => ['nullable', 'string', 'max:255'],

            'medical_history' => ['nullable', 'array'],
            'medical_history.*.date' => ['nullable', 'date'],
            'medical_history.*.type' => ['nullable', 'string', 'max:255'],
            'medical_history.*.description' => ['nullable', 'string'],
            'medical_history.*.vet' => ['nullable', 'string', 'max:255'],
            'medical_history.*.notes' => ['nullable', 'string'],
        ]);

        // Ensure either image file or image_url is provided
        if (empty($validated['image']) && empty($validated['image_url'])) {
            return redirect()->back()->withErrors([
                'image' => 'Please provide either an image file or an image URL.'
            ])->withInput();
        }

        $pet = DB::transaction(function () use ($validated, $user, $request) {
            // Handle file upload if provided
            $imageUrl = $validated['image_url'] ?? null;
            if ($request->hasFile('image')) {
                $disk     = config('filesystems.upload_disk');
                $path     = $request->file('image')->store('pet-images', $disk);
                $imageUrl = $disk === 'public'
                    ? '/storage/' . $path
                    : Storage::disk($disk)->url($path);
            }

            $shelter = Shelter::firstOrCreate(
                ['name' => $validated['shelter_name']],
                ['created_by' => $user->id]
            );

            $pet = Pet::create([
                'created_by' => $user->id,
                'name' => $validated['name'],
                'species' => $validated['species'],
                'breed' => $validated['breed'],
                'age' => $validated['age'],
                'age_unit' => $validated['age_unit'] ?? 'years',
                'gender' => $validated['gender'],
                'size' => $validated['size'],
                'color' => $validated['color'] ?? null,
                'weight' => $validated['weight'] ?? null,
                'medical_status' => $validated['medical_status'],
                'is_vetted' => $validated['is_vetted'] ?? true,
                'availability_status' => $validated['availability_status'] ?? true,
                'adoption_fee' => $validated['adoption_fee'],
                'shelter_id' => $shelter->id,
                'description' => $validated['description'],
                'temperament_tags' => $validated['temperament_tags'] ?? [],
                'photos' => $validated['photos'] ?? [],
                'personality_traits' => $validated['personality_traits'] ?? [],
                'good_with' => $validated['good_with'] ?? [],
                'not_good_with' => $validated['not_good_with'] ?? [],
                'special_needs' => $validated['special_needs'] ?? null,
                'dietary_needs' => $validated['dietary_needs'] ?? null,
                'exercise_requirements' => $validated['exercise_requirements'] ?? null,
            ]);

            if ($imageUrl) {
                $pet->petImages()->create([
                    'url'        => $imageUrl,
                    'is_primary' => true,
                    'order'      => 0,
                ]);
            }

            $shelter->shelterContact()->updateOrCreate(
                ['shelter_id' => $shelter->id],
                [
                    'created_by' => $user->id,
                    'name' => $validated['contact']['name'],
                    'phone' => $validated['contact']['phone'],
                    'email' => $validated['contact']['email'],
                    'website' => $validated['contact']['website'] ?? null,
                    'address' => $validated['contact']['address'],
                    'hours' => $validated['contact']['hours'] ?? null,
                ]
            );

            foreach ($validated['medical_history'] ?? [] as $record) {
                $pet->medicalRecords()->create([
                    'created_by' => $user->id,
                    'record_date' => $record['date'] ?? null,
                    'type' => $record['type'],
                    'description' => $record['description'],
                    'vet' => $record['vet'] ?? null,
                    'notes' => $record['notes'] ?? null,
                ]);
            }

            return $pet;
        });

        return redirect()->route('pets.show', ['id' => $pet->id]);
    }
}
