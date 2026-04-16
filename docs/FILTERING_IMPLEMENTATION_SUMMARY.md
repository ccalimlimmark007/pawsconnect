# PawsConnect Filtering & Search API Implementation

## 🎯 Objective Completed

Built a scalable **Laravel backend API** to power the filtering and search functionality for the PawsConnect adoption platform.

---

## 📊 Database Schema

### New Fields Added to `pets` Table

```sql
-- Migration: 2026_03_05_075705_add_filter_fields_to_pets_table.php
- color (string, nullable) - Pet's color
- weight (decimal, nullable) - Pet's weight in lbs/kg
- is_vetted (boolean, default: true) - Veterinary check status
- availability_status (boolean, default: true) - Whether pet is available for adoption
```

### Complete Pets Table Structure

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| created_by | bigint | Foreign key to users |
| name | string | Pet's name |
| species | string | Dog, Cat, etc. |
| breed | string | Specific breed |
| age | integer | Numerical age |
| age_unit | string | years, months |
| gender | string | Male, Female, Unknown |
| size | string | Small, Medium, Large, Extra Large |
| **color** | string | **NEW** Pet's color |
| **weight** | decimal | **NEW** Pet's weight |
| medical_status | string | Health status |
| **is_vetted** | boolean | **NEW** Vet checked |
| **availability_status** | boolean | **NEW** Available for adoption |
| adoption_fee | decimal | Adoption cost |
| shelter_name | string | Shelter/rescue name |
| image_url | string | Primary image URL |
| description | text | Pet description |
| temperament_tags | json | Array of temperament traits |
| personality_traits | json | Array of personality traits |
| photos | json | Additional photo URLs |
| good_with | json | Compatible with (kids, pets, etc.) |
| not_good_with | json | Incompatibilities |
| special_needs | text | Special requirements |
| dietary_needs | text | Food requirements |
| exercise_requirements | text | Activity needs |
| created_at | timestamp | When posted |
| updated_at | timestamp | Last modified |

---

## 🚀 API Endpoints

### 1. **GET `/api/pets`** - Filtered Pet Search

Returns paginated, filtered, and sorted pets.

#### Supported Query Parameters

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `q` | string | Text search (name, breed, personality) | `?q=golden retriever` |
| `species` | string | Filter by species (comma-separated) | `?species=Dog,Cat` |
| `breed` | string | Filter by breed (comma-separated) | `?breed=Beagle,Pug` |
| `gender` | string | Filter by gender | `?gender=Male` |
| `size` | string | Filter by size (comma-separated) | `?size=Small,Medium` |
| `age_min` | integer | Minimum age | `?age_min=1` |
| `age_max` | integer | Maximum age | `?age_max=5` |
| `is_vetted` | boolean | Filter by vet status | `?is_vetted=true` |
| `available_only` | boolean | Only available pets | `?available_only=true` |
| `sort_by` | string | Sort field (date_posted, age, name) | `?sort_by=age` |
| `sort_order` | string | asc or desc | `?sort_order=asc` |
| `page` | integer | Page number | `?page=2` |
| `limit` | integer | Results per page (max: 100) | `?limit=12` |

#### Example Response

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
      "temperamentTags": ["Friendly", "Active"],
      "personalityTraits": ["Energetic", "Playful"],
      "isVetted": true,
      "availabilityStatus": true,
      "imageUrl": "...",
      "adoptionFee": 350.00
    }
  ]
}
```

### 2. **GET `/api/pets/stats`** - Pet Statistics

Returns aggregated statistics.

#### Example Response

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
    "Beagle": 4
  }
}
```

---

## 🔧 Implementation Details

### Backend Files Created/Modified

1. **Migration**: `database/migrations/2026_03_05_075705_add_filter_fields_to_pets_table.php`
   - Added: color, weight, is_vetted, availability_status

2. **Model**: `app/Models/Pet.php`
   - Updated fillable fields
   - Added casts for new fields

3. **Controller**: `app/Http/Controllers/Api/PetFilterController.php`
   - `index()` - Dynamic filtering with query builder
   - `stats()` - Aggregated statistics
   - Supports comma-separated multi-select filters
   - Pagination with configurable limits

4. **Routes**: `routes/web.php`
   - `GET /api/pets` → PetFilterController@index
   - `GET /api/pets/stats` → PetFilterController@stats

5. **PostPetController**: Updated to save new fields with defaults

### Frontend Files Created

1. **Hook**: `resources/js/hooks/use-pet-filters.ts`
   - `usePetFilters()` - Fetch filtered pets
   - `usePetStats()` - Fetch statistics
   - TypeScript typed with proper interfaces

2. **Documentation**:
   - `docs/API_FILTERING.md` - Complete API documentation
   - `docs/EXAMPLE_PETS_INDEX.tsx` - Example React implementation

---

## 💡 Key Features

### ✅ Dynamic Query Building
Only applies filters that are present in the request. No filters = all available pets.

### ✅ Multi-Select Support
Users can select multiple breeds, sizes, species simultaneously:
```
/api/pets?breed=Beagle,Pug,Bulldog&size=Small,Medium
```

### ✅ Text Search
Searches across:
- Pet name
- Breed
- Description
- Personality traits (JSON array)

### ✅ Range Filters
Age range filtering with min/max:
```
/api/pets?age_min=1&age_max=3
```

### ✅ Sorting Options
- Newest first (default)
- By age (youngest/oldest)
- By name (A-Z)

### ✅ Pagination
- Default: 12 pets per page
- Configurable with `limit` parameter
- Max: 100 per page (prevents overload)
- Returns pagination metadata

### ✅ Eager Loading
Uses Laravel's `with()` to prevent N+1 queries on relationships.

### ✅ Availability Filter
By default, only shows available pets (`availability_status = true`). Can be disabled.

---

## 🎨 Frontend Integration Example

```typescript
import { usePetFilters, usePetStats } from '@/hooks/use-pet-filters';

function PetsPage() {
  const { pets, loading, pagination } = usePetFilters({
    species: ['Dog'],
    size: ['Medium', 'Large'],
    age_min: 1,
    age_max: 5,
    sort_by: 'age',
    page: 1
  });

  const { stats } = usePetStats();

  return (
    <div>
      <h2>{stats?.available_pets} Pets Available</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {pets.map(pet => <PetCard key={pet.id} pet={pet} />)}
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Testing the API

### Using cURL

```bash
# Basic search
curl "http://127.0.0.1:8000/api/pets?q=friendly"

# Multi-breed filter
curl "http://127.0.0.1:8000/api/pets?breed=Beagle,Pug&size=Small"

# Age range
curl "http://127.0.0.1:8000/api/pets?age_min=1&age_max=3&species=Dog"

# Get statistics
curl "http://127.0.0.1:8000/api/pets/stats"

# Pagination
curl "http://127.0.0.1:8000/api/pets?page=2&limit=12"
```

### Browser Testing

Simply open:
```
http://127.0.0.1:8000/api/pets
http://127.0.0.1:8000/api/pets?species=Dog&size=Large
http://127.0.0.1:8000/api/pets/stats
```

---

## 📈 Performance Optimizations

### Recommended Database Indexes

Add these indexes for better query performance:

```php
// In a new migration
$table->index('species');
$table->index('breed');
$table->index('size');
$table->index('gender');
$table->index('availability_status');
$table->index('created_at');
$table->index(['availability_status', 'created_at']); // Composite
```

### Caching Strategy

Consider caching the `/stats` endpoint:

```php
use Illuminate\Support\Facades\Cache;

public function stats(): JsonResponse
{
    $stats = Cache::remember('pet_stats', 300, function () {
        // ... existing stats logic
    });
    
    return response()->json($stats);
}
```

---

## 🔄 Migration Commands

```bash
# Run new migrations
php artisan migrate

# Fresh start (caution: drops all tables)
php artisan migrate:fresh

# Rollback last migration
php artisan migrate:rollback

# Clear all caches
php artisan optimize:clear
```

---

## 📚 Complete Documentation

- **API Reference**: `docs/API_FILTERING.md`
- **Usage Example**: `docs/EXAMPLE_PETS_INDEX.tsx`
- **React Hook**: `resources/js/hooks/use-pet-filters.ts`

---

## ✨ Summary

You now have a **production-ready, scalable filtering API** that supports:
- ✅ Text search across multiple fields
- ✅ Multi-select categorical filters (species, breed, size)
- ✅ Range filters (age)
- ✅ Boolean filters (vetted status, availability)
- ✅ Multiple sorting options
- ✅ Pagination with metadata
- ✅ Aggregated statistics
- ✅ TypeScript-typed React hooks
- ✅ Dynamic query building (only applies active filters)

The API is ready to power your PawsConnect adoption platform with robust filtering and search capabilities! 🐾
