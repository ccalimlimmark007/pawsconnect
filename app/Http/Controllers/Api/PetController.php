<?php

namespace App\Http\Controllers\Api;

use App\Enums\Role;
use App\Models\Pet;
use App\Models\Shelter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class PetController extends Controller
{
    /**
     * Update a pet record
     * 
     * @param Request $request
     * @param string $id Pet ID
     * @return JsonResponse
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        // Check if user is authenticated
        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'errors' => ['auth' => ['You must be logged in to edit pets.']]
            ], 401);
        }

        // Find the pet
        $pet = Pet::find($id);
        $wasAvailable = $pet?->availability_status;

        // Check if pet exists
        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found.',
                'errors' => ['pet' => ['The pet you are trying to edit does not exist.']]
            ], 404);
        }

        // Admins may edit any pet; shelter staff may only edit their own
        if (! $user->isAdmin() && (int) $pet->created_by !== (int) $user->id) {
            return response()->json([
                'message' => 'Unauthorized.',
                'errors' => ['authorization' => ['You do not have permission to edit this pet.']]
            ], 403);
        }

        // Validate the incoming request
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'species' => ['sometimes', 'string', 'max:255'],
            'breed' => ['sometimes', 'string', 'max:255'],
            'age' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'age_unit' => ['sometimes', 'string', 'in:months,years'],
            'gender' => ['sometimes', 'string', 'in:Male,Female,Unknown'],
            'size' => ['sometimes', 'string', 'in:Small,Medium,Large,Extra Large'],
            'color' => ['sometimes', 'nullable', 'string', 'max:100'],
            'weight' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:500'],
            'medical_status' => ['sometimes', 'string', 'max:255'],
            'is_vetted' => ['sometimes', 'boolean'],
            'availability_status' => ['sometimes', 'boolean'],
            'adoption_fee' => ['sometimes', 'numeric', 'min:0'],
            'shelter_name' => ['sometimes', 'string', 'max:255'],
            'image' => ['sometimes', 'nullable', 'image', 'mimes:jpeg,png,jpg,gif,webp', 'max:5120'],
            'image_url' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'description' => ['sometimes', 'string'],

            'temperament_tags' => ['sometimes', 'nullable', 'array'],
            'temperament_tags.*' => ['string', 'max:100'],
            'photos' => ['sometimes', 'nullable', 'array'],
            'photos.*' => ['nullable', 'url', 'max:2048'],
            'personality_traits' => ['sometimes', 'nullable', 'array'],
            'personality_traits.*' => ['string', 'max:100'],
            'good_with' => ['sometimes', 'nullable', 'array'],
            'good_with.*' => ['string', 'max:100'],
            'not_good_with' => ['sometimes', 'nullable', 'array'],
            'not_good_with.*' => ['string', 'max:100'],
            'special_needs' => ['sometimes', 'nullable', 'string'],
            'dietary_needs' => ['sometimes', 'nullable', 'string'],
            'exercise_requirements' => ['sometimes', 'nullable', 'string'],

            'contact' => ['sometimes', 'array'],
            'contact.name' => ['sometimes', 'string', 'max:255'],
            'contact.phone' => ['sometimes', 'string', 'max:100'],
            'contact.email' => ['sometimes', 'email', 'max:255'],
            'contact.website' => ['sometimes', 'nullable', 'url', 'max:2048'],
            'contact.address' => ['sometimes', 'string', 'max:1000'],
            'contact.hours' => ['sometimes', 'nullable', 'string', 'max:255'],

            'medical_history' => ['sometimes', 'nullable', 'array'],
            'medical_history.*.date' => ['nullable', 'date'],
            'medical_history.*.type' => ['nullable', 'string', 'max:255'],
            'medical_history.*.description' => ['nullable', 'string'],
            'medical_history.*.vet' => ['nullable', 'string', 'max:255'],
            'medical_history.*.notes' => ['nullable', 'string'],
        ]);

        // Update pet in transaction
        try {
            $updatedPet = DB::transaction(function () use ($validated, $pet, $request, $user) {
                // Handle image upload — replaces the current primary image
                if ($request->hasFile('image') || isset($validated['image_url'])) {
                    $newUrl = null;

                    if ($request->hasFile('image')) {
                        $disk   = config('filesystems.upload_disk');
                        $path   = $request->file('image')->store('pet-images', $disk);
                        $newUrl = $disk === 'public'
                            ? '/storage/' . $path
                            : Storage::disk($disk)->url($path);
                    } elseif (! empty($validated['image_url'])) {
                        $newUrl = $validated['image_url'];
                    }

                    if ($newUrl) {
                        $pet->load('petImages');

                        // Delete old primary local file
                        $oldPrimary = $pet->petImages->firstWhere('is_primary', true);
                        if ($oldPrimary) {
                            if (str_starts_with($oldPrimary->url, '/storage/')) {
                                Storage::disk('public')->delete(str_replace('/storage/', '', $oldPrimary->url));
                            } elseif (str_starts_with($oldPrimary->url, 'http')) {
                                $s3Path = ltrim(parse_url($oldPrimary->url, PHP_URL_PATH), '/');
                                Storage::disk('s3')->delete($s3Path);
                            }
                            $oldPrimary->delete();
                        }

                        $pet->petImages()->update(['is_primary' => false]);
                        $pet->petImages()->create([
                            'url'        => $newUrl,
                            'is_primary' => true,
                            'order'      => 0,
                        ]);
                    }
                }

                // Update pet basic info
                $petData = [
                    'name' => $validated['name'] ?? $pet->name,
                    'species' => $validated['species'] ?? $pet->species,
                    'breed' => $validated['breed'] ?? $pet->breed,
                    'age' => $validated['age'] ?? $pet->age,
                    'age_unit' => $validated['age_unit'] ?? $pet->age_unit,
                    'gender' => $validated['gender'] ?? $pet->gender,
                    'size' => $validated['size'] ?? $pet->size,
                    'color' => $validated['color'] ?? $pet->color,
                    'weight' => $validated['weight'] ?? $pet->weight,
                    'medical_status' => $validated['medical_status'] ?? $pet->medical_status,
                    'is_vetted' => $validated['is_vetted'] ?? $pet->is_vetted,
                    'availability_status' => $validated['availability_status'] ?? $pet->availability_status,
                    'adoption_fee' => $validated['adoption_fee'] ?? $pet->adoption_fee,
                    'shelter_id'   => isset($validated['shelter_name'])
                        ? Shelter::firstOrCreate(
                            ['name' => $validated['shelter_name']],
                            ['created_by' => $user->id]
                        )->id
                        : $pet->shelter_id,
                    'description' => $validated['description'] ?? $pet->description,
                    'temperament_tags' => $validated['temperament_tags'] ?? $pet->temperament_tags,
                    'photos' => $validated['photos'] ?? $pet->photos,
                    'personality_traits' => $validated['personality_traits'] ?? $pet->personality_traits,
                    'good_with' => $validated['good_with'] ?? $pet->good_with,
                    'not_good_with' => $validated['not_good_with'] ?? $pet->not_good_with,
                    'special_needs' => $validated['special_needs'] ?? $pet->special_needs,
                    'dietary_needs' => $validated['dietary_needs'] ?? $pet->dietary_needs,
                    'exercise_requirements' => $validated['exercise_requirements'] ?? $pet->exercise_requirements,
                ];

                $pet->update($petData);

                // Reload shelter relation in case shelter_id changed
                $pet->load('shelter');

                // Update shelter contact if provided
                if (isset($validated['contact']) && $pet->shelter) {
                    $shelterContact = $pet->shelter->shelterContact
                        ?? $pet->shelter->shelterContact()->create(['created_by' => $user->id]);

                    $shelterContact->update([
                        'name' => $validated['contact']['name'] ?? $shelterContact->name,
                        'phone' => $validated['contact']['phone'] ?? $shelterContact->phone,
                        'email' => $validated['contact']['email'] ?? $shelterContact->email,
                        'website' => $validated['contact']['website'] ?? $shelterContact->website,
                        'address' => $validated['contact']['address'] ?? $shelterContact->address,
                        'hours' => $validated['contact']['hours'] ?? $shelterContact->hours,
                    ]);
                }

                // Update medical history if provided
                if (isset($validated['medical_history'])) {
                    // Delete existing records
                    $pet->medicalRecords()->delete();

                    // Create new records
                    foreach ($validated['medical_history'] as $record) {
                        $pet->medicalRecords()->create([
                            'created_by' => $user->id,
                            'record_date' => $record['date'] ?? null,
                            'type' => $record['type'] ?? null,
                            'description' => $record['description'] ?? null,
                            'vet' => $record['vet'] ?? null,
                            'notes' => $record['notes'] ?? null,
                        ]);
                    }
                }

                // Explicit log when availability is toggled
                if (isset($validated['availability_status']) && $validated['availability_status'] !== $wasAvailable) {
                    $label = $validated['availability_status'] ? 'available' : 'unavailable';
                    activity('pets')
                        ->performedOn($pet)
                        ->causedBy($user)
                        ->withProperties(['availability_status' => $validated['availability_status']])
                        ->log("Pet marked as {$label}");
                }

                return $pet;
            });

            $updatedPet->load(['shelter.shelterContact', 'petImages']);

            $primaryUrl = $updatedPet->petImages->firstWhere('is_primary', true)?->url
                ?? $updatedPet->petImages->first()?->url;

            // Return the updated pet
            return response()->json([
                'message' => 'Pet updated successfully.',
                'pet' => [
                    'id' => (string) $updatedPet->id,
                    'name' => $updatedPet->name,
                    'species' => $updatedPet->species,
                    'breed' => $updatedPet->breed,
                    'age' => $updatedPet->age,
                    'ageUnit' => $updatedPet->age_unit,
                    'gender' => $updatedPet->gender,
                    'size' => $updatedPet->size,
                    'color' => $updatedPet->color,
                    'weight' => $updatedPet->weight ? (float) $updatedPet->weight : null,
                    'medicalStatus' => $updatedPet->medical_status,
                    'isVetted' => $updatedPet->is_vetted,
                    'availabilityStatus' => $updatedPet->availability_status,
                    'adoptionFee' => (float) $updatedPet->adoption_fee,
                    'shelterName' => $updatedPet->shelter?->name,
                    'imageUrl' => $primaryUrl,
                    'description' => $updatedPet->description,
                    'temperamentTags' => $updatedPet->temperament_tags ?? [],
                    'personalityTraits' => $updatedPet->personality_traits ?? [],
                    'datePosted' => optional($updatedPet->created_at)?->toDateString(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while updating the pet.',
                'errors' => ['database' => [$e->getMessage()]]
            ], 500);
        }
    }

    /**
     * Get a single pet by ID (for verification/preview)
     * 
     * @param string $id Pet ID
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        $pet = Pet::with(['shelter.shelterContact', 'petImages'])->find($id);

        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found.',
                'errors' => ['pet' => ['The requested pet does not exist.']]
            ], 404);
        }

        $primaryUrl = $pet->petImages->firstWhere('is_primary', true)?->url
            ?? $pet->petImages->first()?->url;

        return response()->json([
            'pet' => [
                'id' => (string) $pet->id,
                'name' => $pet->name,
                'species' => $pet->species,
                'breed' => $pet->breed,
                'age' => $pet->age,
                'ageUnit' => $pet->age_unit,
                'gender' => $pet->gender,
                'size' => $pet->size,
                'color' => $pet->color,
                'weight' => $pet->weight ? (float) $pet->weight : null,
                'medicalStatus' => $pet->medical_status,
                'isVetted' => $pet->is_vetted,
                'availabilityStatus' => $pet->availability_status,
                'adoptionFee' => (float) $pet->adoption_fee,
                'shelterName' => $pet->shelter?->name,
                'imageUrl' => $primaryUrl,
                'description' => $pet->description,
                'temperamentTags' => $pet->temperament_tags ?? [],
                'personalityTraits' => $pet->personality_traits ?? [],
                'datePosted' => optional($pet->created_at)?->toDateString(),
                'shelterContact' => $pet->shelter?->shelterContact ? [
                    'name' => $pet->shelter->shelterContact->name,
                    'phone' => $pet->shelter->shelterContact->phone,
                    'email' => $pet->shelter->shelterContact->email,
                    'website' => $pet->shelter->shelterContact->website,
                    'address' => $pet->shelter->shelterContact->address,
                    'hours' => $pet->shelter->shelterContact->hours,
                ] : null,
            ]
        ], 200);
    }

    /**
     * Delete a pet record owned by the authenticated user
     *
     * @param Request $request
     * @param string $id Pet ID
     * @return JsonResponse
     */
    public function destroy(Request $request, string $id): JsonResponse|RedirectResponse
    {
        $wantsJson = $request->expectsJson() || $request->is('api/*');
        $user = $request->user();

        if (!$user) {
            if ($wantsJson) {
                return response()->json([
                    'message' => 'Unauthenticated.',
                    'errors' => ['auth' => ['You must be logged in to delete pets.']]
                ], 401);
            }

            return redirect()->route('login');
        }

        $pet = Pet::find($id);

        if (!$pet) {
            if ($wantsJson) {
                return response()->json([
                    'message' => 'Pet not found.',
                    'errors' => ['pet' => ['The pet you are trying to delete does not exist.']]
                ], 404);
            }

            return redirect()->route('profile')->with('status', 'Pet not found.');
        }

        // Admins may delete any pet; shelter staff may only delete their own
        if (! $user->isAdmin() && (int) $pet->created_by !== (int) $user->id) {
            if ($wantsJson) {
                return response()->json([
                    'message' => 'Unauthorized.',
                    'errors' => ['authorization' => ['You do not have permission to delete this pet.']]
                ], 403);
            }

            return redirect()->route('profile')->with('status', 'You do not have permission to delete this pet.');
        }

        try {
            DB::transaction(function () use ($pet) {
                // Soft-delete child records before soft-deleting the pet
                $pet->medicalRecords()->delete();
                $pet->delete();
            });

            if ($wantsJson) {
                return response()->json([
                    'message' => 'Pet deleted successfully.'
                ], 200);
            }

            return redirect()->route('profile')->with('status', 'Pet deleted successfully.');
        } catch (\Exception $e) {
            if ($wantsJson) {
                return response()->json([
                    'message' => 'An error occurred while deleting the pet.',
                    'errors' => ['database' => [$e->getMessage()]]
                ], 500);
            }

            return redirect()->route('profile')->with('status', 'An error occurred while deleting the pet.');
        }
    }
}
