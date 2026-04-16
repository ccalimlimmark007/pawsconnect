<?php

namespace App\Http\Controllers\Api;

use App\Models\Pet;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

        // Check if pet exists
        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found.',
                'errors' => ['pet' => ['The pet you are trying to edit does not exist.']]
            ], 404);
        }

        // Check if user is the owner
        if ((int) $pet->created_by !== (int) $user->id) {
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
                // Handle image upload if provided
                if ($request->hasFile('image')) {
                    // Delete old image if it exists
                    if ($pet->image_url && str_starts_with($pet->image_url, '/storage/')) {
                        $oldPath = str_replace('/storage/', '', $pet->image_url);
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                    }

                    // Store new image
                    $path = $request->file('image')->store('pet-images', 'public');
                    $validated['image_url'] = '/storage/' . $path;
                } elseif (isset($validated['image_url']) && $validated['image_url'] === null) {
                    // If explicitly setting image_url to null, handle accordingly
                    if ($pet->image_url && str_starts_with($pet->image_url, '/storage/')) {
                        $oldPath = str_replace('/storage/', '', $pet->image_url);
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
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
                    'shelter_name' => $validated['shelter_name'] ?? $pet->shelter_name,
                    'image_url' => $validated['image_url'] ?? $pet->image_url,
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

                // Update shelter contact if provided
                if (isset($validated['contact'])) {
                    $shelterContact = $pet->shelterContact ?? $pet->shelterContact()->create(['created_by' => $user->id]);

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

                return $pet;
            });

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
                    'shelterName' => $updatedPet->shelter_name,
                    'imageUrl' => $updatedPet->image_url,
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
        $pet = Pet::find($id);

        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found.',
                'errors' => ['pet' => ['The requested pet does not exist.']]
            ], 404);
        }

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
                'shelterName' => $pet->shelter_name,
                'imageUrl' => $pet->image_url,
                'description' => $pet->description,
                'temperamentTags' => $pet->temperament_tags ?? [],
                'personalityTraits' => $pet->personality_traits ?? [],
                'datePosted' => optional($pet->created_at)?->toDateString(),
                'shelterContact' => $pet->shelterContact ? [
                    'name' => $pet->shelterContact->name,
                    'phone' => $pet->shelterContact->phone,
                    'email' => $pet->shelterContact->email,
                    'website' => $pet->shelterContact->website,
                    'address' => $pet->shelterContact->address,
                    'hours' => $pet->shelterContact->hours,
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
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
                'errors' => ['auth' => ['You must be logged in to delete pets.']]
            ], 401);
        }

        $pet = Pet::find($id);

        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found.',
                'errors' => ['pet' => ['The pet you are trying to delete does not exist.']]
            ], 404);
        }

        if ((int) $pet->created_by !== (int) $user->id) {
            return response()->json([
                'message' => 'Unauthorized.',
                'errors' => ['authorization' => ['You do not have permission to delete this pet.']]
            ], 403);
        }

        try {
            DB::transaction(function () use ($pet) {
                if ($pet->image_url && str_starts_with($pet->image_url, '/storage/')) {
                    $oldPath = str_replace('/storage/', '', $pet->image_url);
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
                }

                // Some environments may not have all optional relation tables migrated yet.
                if (Schema::hasTable('pet_medical_records')) {
                    $pet->medicalRecords()->delete();
                }

                if (Schema::hasTable('shelter_contacts')) {
                    $pet->shelterContact()->delete();
                }

                $pet->delete();
            });

            return response()->json([
                'message' => 'Pet deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while deleting the pet.',
                'errors' => ['database' => [$e->getMessage()]]
            ], 500);
        }
    }
}
