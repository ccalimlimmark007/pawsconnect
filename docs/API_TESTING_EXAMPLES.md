# PawsConnect API - Testing Examples

Test these endpoints with curl in PowerShell or any REST client like Postman.

## 1. Basic Requests

### Get all available pets (default behavior)
```bash
curl http://127.0.0.1:8000/api/pets
```

### Get pet statistics
```bash
curl http://127.0.0.1:8000/api/pets/stats
```

---

## 2. Text Search

### Search for "golden"
```bash
curl "http://127.0.0.1:8000/api/pets?q=golden"
```

### Search for "friendly" personality
```bash
curl "http://127.0.0.1:8000/api/pets?q=friendly"
```

---

## 3. Category Filters

### Single species filter
```bash
curl "http://127.0.0.1:8000/api/pets?species=Dog"
```

### Multiple species
```bash
curl "http://127.0.0.1:8000/api/pets?species=Dog,Cat"
```

### Single breed filter
```bash
curl "http://127.0.0.1:8000/api/pets?breed=Golden%20Retriever"
```

### Multiple breeds
```bash
curl "http://127.0.0.1:8000/api/pets?breed=Beagle,Pug,Bulldog"
```

### Single size filter
```bash
curl "http://127.0.0.1:8000/api/pets?size=Large"
```

### Multiple sizes
```bash
curl "http://127.0.0.1:8000/api/pets?size=Small,Medium"
```

### Gender filter
```bash
curl "http://127.0.0.1:8000/api/pets?gender=Male"
```

---

## 4. Combination Filters (Filter Modal)

### User selects multiple breeds and sizes
```bash
curl "http://127.0.0.1:8000/api/pets?breed=Beagle,Pug&size=Small,Medium"
```

### Dogs only, medium-large only
```bash
curl "http://127.0.0.1:8000/api/pets?species=Dog&size=Medium,Large"
```

### Cats, any size, only vetted
```bash
curl "http://127.0.0.1:8000/api/pets?species=Cat&is_vetted=true"
```

---

## 5. Age Range Filters

### Young pets (0-2 years)
```bash
curl "http://127.0.0.1:8000/api/pets?age_min=0&age_max=2"
```

### Middle-aged pets (3-5 years)
```bash
curl "http://127.0.0.1:8000/api/pets?age_min=3&age_max=5"
```

### Senior pets (6+ years)
```bash
curl "http://127.0.0.1:8000/api/pets?age_min=6"
```

---

## 6. Sorting

### Sort by newest (default)
```bash
curl "http://127.0.0.1:8000/api/pets?sort_by=date_posted&sort_order=desc"
```

### Sort by oldest first
```bash
curl "http://127.0.0.1:8000/api/pets?sort_by=date_posted&sort_order=asc"
```

### Sort by age (youngest first)
```bash
curl "http://127.0.0.1:8000/api/pets?sort_by=age&sort_order=asc"
```

### Sort by age (oldest first)
```bash
curl "http://127.0.0.1:8000/api/pets?sort_by=age&sort_order=desc"
```

### Sort by name (A-Z)
```bash
curl "http://127.0.0.1:8000/api/pets?sort_by=name&sort_order=asc"
```

---

## 7. Pagination

### Page 1 (default, 12 per page)
```bash
curl "http://127.0.0.1:8000/api/pets?page=1&limit=12"
```

### Page 2
```bash
curl "http://127.0.0.1:8000/api/pets?page=2&limit=12"
```

### Show 20 results per page
```bash
curl "http://127.0.0.1:8000/api/pets?page=1&limit=20"
```

### Show 50 results per page
```bash
curl "http://127.0.0.1:8000/api/pets?page=1&limit=50"
```

---

## 8. Complex Combinations

### "Golden Retrievers, medium-large, age 1-3, sorted by age"
```bash
curl "http://127.0.0.1:8000/api/pets?breed=Golden%20Retriever&size=Medium,Large&age_min=1&age_max=3&sort_by=age&sort_order=asc"
```

### "Search for 'friendly', filter to dogs only"
```bash
curl "http://127.0.0.1:8000/api/pets?q=friendly&species=Dog"
```

### "Small pets that are vetted, page 2"
```bash
curl "http://127.0.0.1:8000/api/pets?size=Small&is_vetted=true&page=2&limit=12"
```

### "Cats, any breed, small to medium, young (0-2 years)"
```bash
curl "http://127.0.0.1:8000/api/pets?species=Cat&size=Small,Medium&age_max=2"
```

---

## 9. PowerShell Examples

If you're using Windows PowerShell, use this format:

### Basic search in PowerShell
```powershell
curl 'http://127.0.0.1:8000/api/pets?q=golden' -Headers @{'Accept'='application/json'}
```

### Multi-filter in PowerShell
```powershell
$url = "http://127.0.0.1:8000/api/pets?breed=Beagle,Pug&size=Small,Medium"
curl $url -Headers @{'Accept'='application/json'} | ConvertFrom-Json | Select-Object -ExpandProperty data
```

---

## 10. JavaScript/Fetch Examples

### Basic fetch
```javascript
fetch('/api/pets?q=golden')
  .then(res => res.json())
  .then(data => console.log(data));
```

### With filters
```javascript
const filters = {
  breed: ['Beagle', 'Pug'].join(','),
  size: ['Small', 'Medium'].join(','),
  age_min: 1,
  age_max: 5,
  page: 1,
  limit: 12
};

const params = new URLSearchParams(filters);
fetch(`/api/pets?${params}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### Using async/await
```javascript
async function searchPets() {
  const response = await fetch('/api/pets?species=Dog&size=Large');
  const data = await response.json();
  console.log(`Found ${data.total_results} pets`);
  console.log(`Showing page ${data.page} of ${data.last_page}`);
  data.data.forEach(pet => console.log(pet.name));
}

searchPets();
```

---

## 11. Response Structure

All endpoints return JSON in this format:

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
      "medicalStatus": "Healthy",
      "isVetted": true,
      "availabilityStatus": true,
      "description": "Buddy is a wonderful family dog...",
      "imageUrl": "https://example.com/buddy.jpg",
      "shelterName": "Happy Paws Shelter",
      "adoptionFee": 350.0,
      "dateAdded": "2026-03-01",
      "shelterContact": {
        "phone": "(555) 234-5678",
        "email": "adopt@happypaws.org",
        "address": "1234 Pawprint Lane",
        "hours": "Mon–Sat 10am–6pm"
      }
    }
  ]
}
```

---

## 12. Common Scenarios

### Use Case: "Find me a small, friendly dog"
```bash
curl "http://127.0.0.1:8000/api/pets?q=friendly&species=Dog&size=Small"
```

### Use Case: "Show available cats from newest"
```bash
curl "http://127.0.0.1:8000/api/pets?species=Cat&available_only=true&sort_by=date_posted&sort_order=desc"
```

### Use Case: "Filter modal: user selects Beagle, Pug, and Bulldog"
```bash
curl "http://127.0.0.1:8000/api/pets?breed=Beagle,Pug,Bulldog"
```

### Use Case: "Show young (1-2 years), medium-sized dogs"
```bash
curl "http://127.0.0.1:8000/api/pets?species=Dog&size=Medium&age_min=1&age_max=2&sort_by=age"
```

### Use Case: "Dashboard stats (available pet count)"
```bash
curl "http://127.0.0.1:8000/api/pets/stats"
```

---

## Tips

1. **URL Encoding**: Spaces in URLs should be encoded as `%20`:
   - `Golden Retriever` → `Golden%20Retriever`

2. **Comma-Separated Lists**: For multi-select, join with commas (NO spaces):
   - `breed=Beagle,Pug,Bulldog` ✓
   - `breed=Beagle, Pug, Bulldog` ✗ (spaces will cause issues)

3. **Boolean Values**: Use `true` or `false`:
   - `?is_vetted=true`
   - `?available_only=false`

4. **Query Order Doesn't Matter**:
   - `?species=Dog&size=Large` = `?size=Large&species=Dog`

5. **Test with Postman**: Import the curl commands into Postman for easier testing with a GUI.
