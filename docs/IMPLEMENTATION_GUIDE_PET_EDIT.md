# Pet Edit API - Implementation Guide

## Overview

A complete backend API endpoint system for editing pet listings has been created with full authentication, authorization, validation, and error handling.

## What Was Created

### 1. Backend Controllers

**File:** `app/Http/Controllers/Api/PetController.php`

**Methods:**

#### `update(Request $request, string $id): JsonResponse`
- **Purpose:** Update a pet's information
- **Authentication:** Required (Sanctum)
- **Authorization:** User must be the pet owner
- **Features:**
  - Partial updates (PATCH) or full updates (PUT)
  - Image file upload support with automatic cleanup
  - Nested object/array handling for contact info and medical history
  - Database transaction for data consistency
  - Comprehensive validation

#### `show(string $id): JsonResponse`
- **Purpose:** Retrieve a single pet's details
- **Authentication:** Not required
- **Features:**
  - Public endpoint for viewing pet information
  - Returns formatted pet data with all relations

### 2. Routes

**File:** `routes/web.php`

All routes are protected within an API prefix and require Sanctum authentication:

```
PATCH  /api/pets/{id}  → Api\PetController@update
PUT    /api/pets/{id}  → Api\PetController@update
GET    /api/pets/{id}  → Api\PetController@show
```

### 3. Frontend React Hook

**File:** `resources/js/hooks/use-pet-edit.ts`

**Hook:** `usePetEdit()`

**Returns:**
```typescript
{
  loading: boolean;           // API call in progress
  error: string | null;       // Error message if failed
  success: boolean;           // Update was successful
  updatePet: (id, data) => Promise<Pet | null>;  // API function
  clearError: () => void;     // Clear error message
  clearSuccess: () => void;   // Clear success message
}
```

**Features:**
- Automatic FormData creation for file uploads
- Nested object/array support
- Error handling with user-friendly messages
- Type-safe with TypeScript

## Error Handling

### 401 Unauthorized
User is not authenticated. Return to login.

**Response:**
```json
{
  "message": "Unauthenticated.",
  "errors": {
    "auth": ["You must be logged in to edit pets."]
  }
}
```

### 403 Forbidden
User is not the owner of the pet.

**Response:**
```json
{
  "message": "Unauthorized.",
  "errors": {
    "authorization": ["You do not have permission to edit this pet."]
  }
}
```

### 404 Not Found
Pet doesn't exist.

**Response:**
```json
{
  "message": "Pet not found.",
  "errors": {
    "pet": ["The pet you are trying to edit does not exist."]
  }
}
```

### 422 Unprocessable Entity
Validation failed.

**Response:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "age": ["The age must be a number."],
    "adoption_fee": ["The adoption fee must be at least 0."]
  }
}
```

### 500 Internal Server Error
Database or server error.

**Response:**
```json
{
  "message": "An error occurred while updating the pet.",
  "errors": {
    "database": ["Error message"]
  }
}
```

## Validation Rules

### Required Fields
- `name`: String, max 255 chars, required if included
- `age`: Integer 0-100, required if included
- `adoption_fee`: Numeric >= 0, required if included

### Optional Fields (with constraints)
- `species`: String, max 255 chars
- `breed`: String, max 255 chars
- `age_unit`: Either 'months' or 'years'
- `gender`: One of Male, Female, Unknown
- `size`: One of Small, Medium, Large, Extra Large
- `color`: String, max 100 chars
- `weight`: Numeric 0-500
- `medical_status`: String, max 255 chars
- `is_vetted`: Boolean
- `availability_status`: Boolean
- `shelter_name`: String, max 255 chars
- `image`: File (JPEG, PNG, GIF, WebP), max 5MB
- `image_url`: Valid URL, max 2048 chars
- `description`: String (any length)
- `temperament_tags`: Array of strings
- `photos`: Array of valid URLs
- `personality_traits`: Array of strings
- `good_with`: Array of strings
- `not_good_with`: Array of strings
- `special_needs`: String or null
- `dietary_needs`: String or null
- `exercise_requirements`: String or null

### Nested Validation
**contact (Optional object):**
- `contact.name`: String, max 255
- `contact.phone`: String, max 100
- `contact.email`: Valid email
- `contact.website`: Valid URL or null
- `contact.address`: String, max 1000
- `contact.hours`: String or null

**medical_history (Optional array):**
- `medical_history.*.date`: Date or null
- `medical_history.*.type`: String or null
- `medical_history.*.description`: String or null
- `medical_history.*.vet`: String or null
- `medical_history.*.notes`: String or null

## Using the API

### Step 1: Import the Hook

```typescript
import { usePetEdit } from '@/hooks/use-pet-edit';
```

### Step 2: Use in Component

```typescript
const { updatePet, loading, error, success } = usePetEdit();

const handleUpdate = async (petId: string, data: PetUpdatePayload) => {
  const result = await updatePet(petId, {
    name: 'New Name',
    age: 5,
    breed: 'Golden Retriever',
    // ... other fields
  });

  if (result) {
    console.log('Pet updated:', result);
  }
};
```

### Step 3: Handle File Uploads

```typescript
const handleImageUpload = async (petId: string, file: File) => {
  const result = await updatePet(petId, {
    image: file,
  });
};
```

### Step 4: Handle Errors

```typescript
if (error) {
  console.error('Update failed:', error);
  // Show error message to user
}

if (success) {
  console.log('Update successful');
  // Show success message and refresh UI
}
```

## Integration with Profile Component

The Edit button in the Profile component can be updated to use the new API:

```typescript
// Profile.tsx
const [editingPetId, setEditingPetId] = useState<string | null>(null);
const { updatePet, loading, error } = usePetEdit();

const handleEditPet = async (petId: string, data: PetUpdatePayload) => {
  const result = await updatePet(petId, data);
  if (result) {
    // Refresh pet list
    refetch();
    setEditingPetId(null);
  }
};

// In the pet card:
{editingPetId === pet.id ? (
  <EditPetForm 
    pet={pet}
    onSuccess={() => setEditingPetId(null)}
    onCancel={() => setEditingPetId(null)}
  />
) : (
  <Button onClick={() => setEditingPetId(pet.id)}>Edit</Button>
)}
```

## File Storage

- **Location:** `storage/app/public/pet-images/`
- **Public URL:** `/storage/pet-images/{filename}`
- **Cleanup:** Old images are automatically deleted when replaced
- **Max Size:** 5MB per image

## Important Notes

1. **Partial Updates:** Only include fields you want to update in the request
2. **Medical History:** Providing medical_history replaces the entire set (not merged)
3. **Image Handling:** If uploading new image, old one is automatically deleted
4. **Numbers as Strings:** Form submission converts numbers to strings; API accepts both
5. **Timestamps:** All dates returned in ISO 8601 format
6. **UUIDs:** Pet IDs are returned as strings for frontend compatibility

## Testing with cURL

### Update Single Field
```bash
curl -X PATCH http://localhost:8000/api/pets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "name=Buddy&age=5"
```

### Upload Image
```bash
curl -X PATCH http://localhost:8000/api/pets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -F "image=@image.jpg"
```

### Get Pet Details
```bash
curl -X GET http://localhost:8000/api/pets/123e4567-e89b-12d3-a456-426614174000 \
  -H "X-Requested-With: XMLHttpRequest"
```

## Documentation Files

Located in `docs/` folder:

1. **API_PET_EDIT.md** - Complete API reference with examples
2. **EXAMPLE_EDIT_PET_FORM.tsx** - Full-featured React component example
3. **use-pet-edit.ts hook** - React hook for API integration

## Next Steps

1. **Update Profile Component:** Implement modal/page for editing
2. **Add Edit Page:** Create dedicated `/pets/{id}/edit` page
3. **Add Delete Endpoint:** Create DELETE endpoint for pet removal
4. **Add Image Gallery:** Support multiple images per pet
5. **Add Activity Log:** Track who changed what and when

## Quick Reference

| Operation | Endpoint | Method | Auth Required |
|-----------|----------|--------|----------------|
| Get pet details | `/api/pets/{id}` | GET | No |
| Update pet | `/api/pets/{id}` | PATCH/PUT | Yes |
| Create pet | `/post-pet` | POST | Yes |
| List pets | `/api/pets` | GET | No |

---

**Status:** ✅ Complete and ready for integration

**Created:** March 5, 2026
**Framework:** Laravel 12.53.0 + React 19.2.0 + Inertia.js v2.3.7
