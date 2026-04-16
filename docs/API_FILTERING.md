# PawsConnect Pet Filtering API Documentation

## Overview
This API provides comprehensive filtering, searching, sorting, and pagination capabilities for the pet adoption system.

## Base URL
```
http://127.0.0.1:8000/api
```

---

## Endpoints

### 1. GET `/api/pets` - Get Filtered Pets

Returns a paginated list of pets with optional filtering, searching, and sorting.

#### Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Text search across name, breed, description, personality | `q=Golden` |
| `species` | string | Filter by species (comma-separated for multiple) | `species=Dog,Cat` |
| `breed` | string | Filter by breed (comma-separated for multiple) | `breed=Golden Retriever,Beagle` |
| `gender` | string | Filter by gender | `gender=Male` |
| `size` | string | Filter by size (comma-separated for multiple) | `size=Small,Medium` |
| `age_min` | integer | Minimum age | `age_min=1` |
| `age_max` | integer | Maximum age | `age_max=5` |
| `is_vetted` | boolean | Filter by vetted status | `is_vetted=true` |
| `available_only` | boolean | Show only available pets (default: true) | `available_only=true` |
| `sort_by` | string | Sort field: `date_posted`, `age`, `name` (default: `date_posted`) | `sort_by=age` |
| `sort_order` | string | Sort order: `asc`, `desc` (default: `desc`) | `sort_order=asc` |
| `page` | integer | Page number (default: 1) | `page=2` |
| `limit` | integer | Results per page (default: 12, max: 100) | `limit=20` |

#### Example Requests

**Basic search:**
```bash
GET /api/pets?q=friendly
```

**Multiple filters:**
```bash
GET /api/pets?species=Dog&size=Medium,Large&age_min=1&age_max=3
```

**Multi-breed filter (for filter modal):**
```bash
GET /api/pets?breed=Beagle,Pug&size=Small
```

**Sort by age (youngest first):**
```bash
GET /api/pets?sort_by=age&sort_order=asc
```

**Pagination:**
```bash
GET /api/pets?page=2&limit=12
```

#### Response Format

```json
{
  "total_results": 45,
  "page": 1,
  "per_page": 12,
  "last_page": 4,
  "data": [
    {
      "id": "123",
      "name": "Buddy",
      "species": "Dog",
      "breed": "Golden Retriever",
      "age": 2,
      "ageUnit": "years",
      "gender": "Male",
      "size": "Large",
      "color": "Golden",
      "weight": 65.5,
      "temperamentTags": ["Friendly", "Active", "Good with Kids"],
      "personalityTraits": ["Energetic", "Playful", "Loyal"],
      "medicalStatus": "Healthy",
      "isVetted": true,
      "availabilityStatus": true,
      "description": "Buddy is a wonderful family dog...",
      "imageUrl": "https://example.com/buddy.jpg",
      "shelterName": "Happy Paws Shelter",
      "adoptionFee": 350.00,
      "dateAdded": "2026-03-01",
      "shelterContact": {
        "phone": "(555) 234-5678",
        "email": "adopt@happypaws.org",
        "address": "1234 Pawprint Lane, Portland, OR 97201",
        "hours": "Mon–Sat 10am–6pm"
      }
    }
  ]
}
```

---

### 2. GET `/api/pets/stats` - Get Pet Statistics

Returns aggregate statistics about pets in the system.

#### Response Format

```json
{
  "available_pets": 45,
  "total_pets": 50,
  "by_species": {
    "Dog": 28,
    "Cat": 17
  },
  "top_breeds": {
    "Golden Retriever": 5,
    "Beagle": 4,
    "Labrador Retriever": 4,
    "Mixed Breed": 8
  }
}
```

---

## Use Cases

### 1. Display Available Pets Badge
```javascript
fetch('/api/pets/stats')
  .then(res => res.json())
  .then(data => {
    console.log(`${data.available_pets} Pets Available Today`);
  });
```

### 2. Search by Text
```javascript
fetch('/api/pets?q=golden retriever')
  .then(res => res.json())
  .then(data => {
    // Display data.data array of pets
  });
```

### 3. Multi-Select Filter
When user selects multiple breeds from filter modal:
```javascript
const selectedBreeds = ['Beagle', 'Pug', 'Bulldog'];
const selectedSizes = ['Small', 'Medium'];

const params = new URLSearchParams({
  breed: selectedBreeds.join(','),
  size: selectedSizes.join(',')
});

fetch(`/api/pets?${params}`)
  .then(res => res.json())
  .then(data => {
    // Display filtered results
  });
```

### 4. Age Range Filter
```javascript
fetch('/api/pets?age_min=1&age_max=3&species=Dog')
  .then(res => res.json())
  .then(data => {
    // Display young dogs
  });
```

### 5. Sorting
```javascript
// Sort by newest first (default)
fetch('/api/pets?sort_by=date_posted&sort_order=desc')

// Sort by age (oldest first)
fetch('/api/pets?sort_by=age&sort_order=desc')

// Sort by name (A-Z)
fetch('/api/pets?sort_by=name&sort_order=asc')
```

### 6. Pagination with Virtual Scroll
```javascript
let currentPage = 1;
const loadMore = () => {
  fetch(`/api/pets?page=${currentPage}&limit=12`)
    .then(res => res.json())
    .then(data => {
      appendPetsToGrid(data.data);
      if (currentPage < data.last_page) {
        currentPage++;
      }
    });
};
```

---

## Frontend Integration

### React Hook Example

```typescript
// hooks/use-pet-filters.ts
import { useState, useEffect } from 'react';

interface PetFilters {
  q?: string;
  species?: string[];
  breed?: string[];
  gender?: string;
  size?: string[];
  age_min?: number;
  age_max?: number;
  sort_by?: string;
  page?: number;
}

export function usePetFilters(filters: PetFilters) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.q) params.append('q', filters.q);
    if (filters.species) params.append('species', filters.species.join(','));
    if (filters.breed) params.append('breed', filters.breed.join(','));
    if (filters.gender) params.append('gender', filters.gender);
    if (filters.size) params.append('size', filters.size.join(','));
    if (filters.age_min) params.append('age_min', String(filters.age_min));
    if (filters.age_max) params.append('age_max', String(filters.age_max));
    if (filters.sort_by) params.append('sort_by', filters.sort_by);
    if (filters.page) params.append('page', String(filters.page));

    setLoading(true);
    fetch(`/api/pets?${params}`)
      .then(res => res.json())
      .then(data => {
        setPets(data.data);
        setPagination({
          total: data.total_results,
          page: data.page,
          lastPage: data.last_page
        });
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return { pets, loading, pagination };
}
```

---

## Performance Notes

1. **Indexing**: Add database indexes for frequently filtered columns:
   - `species`, `breed`, `size`, `gender`
   - `availability_status`
   - `created_at`

2. **Caching**: Consider caching the `/stats` endpoint response for 5-10 minutes

3. **Pagination**: Default limit is 12 pets per page, max 100 to prevent overload

4. **Query Optimization**: The API uses eager loading for relationships to prevent N+1 queries

---

## Error Responses

### 422 Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "age_min": ["The age min must be at least 0."]
  }
}
```

### 500 Server Error
```json
{
  "message": "Server Error"
}
```
