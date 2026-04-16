# Pet Edit API Documentation

## Overview

The Pet Edit API allows authenticated users to update their own pet listings. This is a RESTful API endpoint that supports partial updates (PATCH) and full updates (PUT) with file upload support.

## Authentication

All endpoints in this API require authentication using Laravel Sanctum. Users must be logged in and own the pet to make updates.

**Headers Required:**
```
Authorization: Bearer {token}
X-Requested-With: XMLHttpRequest
```

## Endpoints

### Update Pet

**Request:**
```
PATCH /api/pets/{id}
PUT /api/pets/{id}
Content-Type: application/x-www-form-urlencoded or multipart/form-data
```

**URL Parameters:**
- `id` (string, required): The UUID of the pet to update

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "name": "string (max 255)",
  "species": "string (max 255)",
  "breed": "string (max 255)",
  "age": "integer (0-100)",
  "age_unit": "months|years",
  "gender": "Male|Female|Unknown",
  "size": "Small|Medium|Large|Extra Large",
  "color": "string|null (max 100)",
  "weight": "decimal|null (0-500)",
  "medical_status": "string (max 255)",
  "is_vetted": "boolean",
  "availability_status": "boolean",
  "adoption_fee": "decimal (>= 0)",
  "shelter_name": "string (max 255)",
  "image": "file (JPEG, PNG, GIF, WebP, max 5MB)",
  "image_url": "string|null (max 2048)",
  "description": "string",
  "temperament_tags": ["string", ...],
  "photos": ["url", ...],
  "personality_traits": ["string", ...],
  "good_with": ["string", ...],
  "not_good_with": ["string", ...],
  "special_needs": "string|null",
  "dietary_needs": "string|null",
  "exercise_requirements": "string|null",
  "contact": {
    "name": "string (max 255)",
    "phone": "string (max 100)",
    "email": "email (max 255)",
    "website": "url|null (max 2048)",
    "address": "string (max 1000)",
    "hours": "string|null (max 255)"
  },
  "medical_history": [
    {
      "date": "YYYY-MM-DD|null",
      "type": "string|null (max 255)",
      "description": "string|null",
      "vet": "string|null (max 255)",
      "notes": "string|null"
    }
  ]
}
```

**Success Response (200 OK):**
```json
{
  "message": "Pet updated successfully.",
  "pet": {
    "id": "string",
    "name": "string",
    "species": "string",
    "breed": "string",
    "age": 5,
    "ageUnit": "years",
    "gender": "Male",
    "size": "Medium",
    "color": "Brown",
    "weight": 25.5,
    "medicalStatus": "Healthy",
    "isVetted": true,
    "availabilityStatus": true,
    "adoptionFee": 150,
    "shelterName": "Happy Paws Shelter",
    "imageUrl": "/storage/pet-images/...",
    "description": "Friendly and energetic dog",
    "temperamentTags": ["Playful", "Friendly"],
    "personalityTraits": ["Curious", "Loyal"],
    "datePosted": "2026-03-05"
  }
}
```

### Error Responses

**401 Unauthorized (Not authenticated):**
```json
{
  "message": "Unauthenticated.",
  "errors": {
    "auth": ["You must be logged in to edit pets."]
  }
}
```

**403 Forbidden (Not owner):**
```json
{
  "message": "Unauthorized.",
  "errors": {
    "authorization": ["You do not have permission to edit this pet."]
  }
}
```

**404 Not Found:**
```json
{
  "message": "Pet not found.",
  "errors": {
    "pet": ["The pet you are trying to edit does not exist."]
  }
}
```

**422 Unprocessable Entity (Validation error):**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "age": ["The age must be a number."],
    "adoption_fee": ["The adoption fee must be at least 0."]
  }
}
```

**500 Internal Server Error:**
```json
{
  "message": "An error occurred while updating the pet.",
  "errors": {
    "database": ["Error message"]
  }
}
```

## Get Pet Details

**Request:**
```
GET /api/pets/{id}
```

**URL Parameters:**
- `id` (string, required): The UUID of the pet

**Success Response (200 OK):**
```json
{
  "pet": {
    "id": "string",
    "name": "string",
    "species": "string",
    "breed": "string",
    "age": 5,
    "ageUnit": "years",
    "gender": "Male",
    "size": "Medium",
    "color": "Brown",
    "weight": 25.5,
    "medicalStatus": "Healthy",
    "isVetted": true,
    "availabilityStatus": true,
    "adoptionFee": 150,
    "shelterName": "Happy Paws Shelter",
    "imageUrl": "/storage/pet-images/...",
    "description": "Friendly and energetic dog",
    "temperamentTags": ["Playful", "Friendly"],
    "personalityTraits": ["Curious", "Loyal"],
    "datePosted": "2026-03-05",
    "shelterContact": {
      "name": "John Doe",
      "phone": "+1-555-0100",
      "email": "john@shelter.com",
      "website": "https://happypaws.com",
      "address": "123 Pet Lane, City, State 12345",
      "hours": "Mon-Fri 9am-5pm"
    }
  }
}
```

## Request Examples

### JavaScript/TypeScript

```typescript
import { usePetEdit } from '@/hooks/use-pet-edit';

export function EditPetForm({ petId }: { petId: string }) {
  const { updatePet, loading, error, success } = usePetEdit();

  const handleSubmit = async (formData: Record<string, any>) => {
    const result = await updatePet(petId, {
      name: formData.name,
      breed: formData.breed,
      age: formData.age,
      gender: formData.gender,
      size: formData.size,
      description: formData.description,
      image: formData.imageFile, // File object
      availability_status: formData.isAvailable,
    });

    if (result) {
      console.log('Pet updated:', result);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {success && <div className="success">Pet updated successfully!</div>}
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Pet'}
      </button>
    </form>
  );
}
```

### cURL

```bash
# Update pet name and image
curl -X PATCH http://localhost:8000/api/pets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -F "name=Buddy Jr." \
  -F "image=@/path/to/image.jpg"

# Update with JSON (form-urlencoded)
curl -X PATCH http://localhost:8000/api/pets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d "age=5&breed=Golden Retriever&gender=Male"
```

### Fetch API

```javascript
const updatePet = async (petId, data) => {
  const formData = new FormData();
  
  // Add fields
  formData.append('name', data.name);
  formData.append('breed', data.breed);
  formData.append('age', data.age);
  
  // Add image if present
  if (data.image instanceof File) {
    formData.append('image', data.image);
  }
  
  const response = await fetch(`/api/pets/${petId}`, {
    method: 'PATCH',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
};
```

## Key Features

1. **Partial Updates**: Use PATCH to update only the fields you need
2. **Full Updates**: Use PUT for complete pet information updates
3. **File Upload**: Automatically handles image uploads and cleanup of old files
4. **Array Fields**: Supports arrays for temperament_tags, medical_history, etc.
5. **Nested Fields**: Handles nested objects like contact information
6. **Validation**: Comprehensive client-side and server-side validation
7. **Authorization**: Ensures only pet owners can edit their listings
8. **Error Handling**: Detailed error messages for debugging

## Validation Rules

### Basic Information
- `name`: Required, string, max 255 chars
- `species`: Required, string, max 255 chars
- `breed`: Required, string, max 255 chars
- `age`: Required, integer between 0-100
- `age_unit`: Optional, must be 'months' or 'years'

### Physical Attributes
- `gender`: Required, one of: Male, Female, Unknown
- `size`: Required, one of: Small, Medium, Large, Extra Large
- `color`: Optional, string, max 100 chars
- `weight`: Optional, numeric, 0-500

### Pet Status
- `medical_status`: Required, string, max 255 chars
- `is_vetted`: Optional, boolean
- `availability_status`: Optional, boolean

### Adoption Info
- `adoption_fee`: Required, numeric, >= 0
- `shelter_name`: Required, string, max 255 chars
- `description`: Required, string

### Media
- `image`: Optional, image file, max 5MB
- `image_url`: Optional, valid URL, max 2048 chars
- `photos`: Optional, array of valid URLs

### Contact Information
- `contact.name`: Optional, string, max 255 chars
- `contact.phone`: Optional, string, max 100 chars
- `contact.email`: Optional, valid email
- `contact.address`: Optional, string, max 1000 chars

## Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Pet successfully updated |
| 401 | Unauthorized | User not authenticated |
| 403 | Forbidden | User is not the pet owner |
| 404 | Not Found | Pet doesn't exist |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error during update |

## Notes

- Images are automatically stored in `storage/app/public/pet-images/`
- Old images are automatically deleted when replaced
- The endpoint automatically creates shelter contact if it doesn't exist
- Medical history is replaced entirely (not merged)
- All timestamps are in ISO 8601 format
- Pet UUIDs are returned as strings for frontend compatibility
