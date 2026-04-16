import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';

type MedicalRecordForm = {
  date: string;
  type: string;
  description: string;
  vet: string;
  notes: string;
};

const temperamentOptions = [
  'High Energy',
  'Calm',
  'Good with Kids',
  'Good with Pets',
  'Playful',
  'Trained',
  'Senior Friendly',
  'First-Time Owner',
];

const dogBreeds = [
  'Golden Retriever',
  'German Shepherd',
  'Labrador Retriever',
  'Poodle',
  'Bulldog',
  'Beagle',
  'Rottweiler',
  'Yorkshire Terrier',
  'Boxer',
  'Dachshund',
  'Mixed Breed',
  'Other',
];

const catBreeds = [
  'Domestic Shorthair',
  'Siamese',
  'Persian',
  'Maine Coon',
  'Ragdoll',
  'Bengal',
  'Sphynx',
  'British Shorthair',
  'Abyssinian',
  'Scottish Fold',
  'Mixed Breed',
  'Other',
];

const shelterNames = [
  'Happy Tails Rescue',
  'Paws & Claws Sanctuary',
  'Golden Paw Shelter',
  'Feline Friends Haven',
  'City Animal Control',
  'Hope For Paws Foundation',
  'Midwest Pet Adoption Center',
  'Suncoast Humane Society',
  'Whiskers Welfare League',
  'Central Valley Animal Shelter',
];

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function PostPet() {
  const page = usePage();
  const user = (page.props as { auth?: { user?: unknown } }).auth?.user;

  const [form, setForm] = useState({
    name: '',
    species: '',
    breed: '',
    age: 1,
    age_unit: 'years',
    gender: '',
    size: '',
    medical_status: 'Healthy',
    adoption_fee: 0,
    shelter_name: '',
    image_url: '',
    description: '',

    temperament_tags: [] as string[],
    photosText: '',
    personalityTraitsText: '',
    goodWithText: '',
    notGoodWithText: '',
    special_needs: '',
    dietary_needs: '',
    exercise_requirements: '',

    contact_name: '',
    contact_phone: '',
    contact_email: '',
    contact_website: '',
    contact_address: '',
    contact_hours: '',
  });

  const [medicalHistory, setMedicalHistory] = useState<MedicalRecordForm[]>([
    { date: '', type: '', description: '', vet: '', notes: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const pageErrors = (page.props as { errors?: Record<string, string> }).errors ?? {};

  // Reset breed when species changes
  useEffect(() => {
    setForm((prev) => ({ ...prev, breed: '' }));
  }, [form.species]);

  // Get available breeds based on species
  const availableBreeds = useMemo(() => {
    if (form.species === 'Dog') return dogBreeds;
    if (form.species === 'Cat') return catBreeds;
    return [];
  }, [form.species]);

  const canSubmit = useMemo(() => {
    return !!(
      form.name &&
      form.breed &&
      form.shelter_name &&
      (form.image_url || imageFile) &&
      form.description &&
      form.contact_name &&
      form.contact_phone &&
      form.contact_email &&
      form.contact_address
    );
  }, [form, imageFile]);

  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }

    return null;
  }

  const toggleTemperament = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      temperament_tags: prev.temperament_tags.includes(tag)
        ? prev.temperament_tags.filter((item) => item !== tag)
        : [...prev.temperament_tags, tag],
    }));
  };

  const updateMedicalRecord = (index: number, key: keyof MedicalRecordForm, value: string) => {
    setMedicalHistory((prev) => prev.map((record, i) => (i === index ? { ...record, [key]: value } : record)));
  };

  const addMedicalRecord = () => {
    setMedicalHistory((prev) => [...prev, { date: '', type: '', description: '', vet: '', notes: '' }]);
  };

  const removeMedicalRecord = (index: number) => {
    setMedicalHistory((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    setForm((p) => ({ ...p, image_url: '' }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Use FormData for proper multipart/form-data encoding with files
    const formDataObj = new FormData();
    
    // Add basic fields
    formDataObj.append('name', form.name);
    formDataObj.append('species', form.species);
    formDataObj.append('breed', form.breed);
    formDataObj.append('age', String(form.age));
    formDataObj.append('age_unit', form.age_unit);
    formDataObj.append('gender', form.gender);
    formDataObj.append('size', form.size);
    formDataObj.append('medical_status', form.medical_status);
    formDataObj.append('adoption_fee', String(form.adoption_fee));
    formDataObj.append('shelter_name', form.shelter_name);
    formDataObj.append('description', form.description);
    formDataObj.append('special_needs', form.special_needs);
    formDataObj.append('dietary_needs', form.dietary_needs);
    formDataObj.append('exercise_requirements', form.exercise_requirements);

    // Add image
    if (imageFile) {
      formDataObj.append('image', imageFile);
    } else if (form.image_url) {
      formDataObj.append('image_url', form.image_url);
    }

    // Add array fields with proper bracket notation for Laravel
    const temperamentTags = form.temperament_tags;
    temperamentTags.forEach((tag, index) => {
      formDataObj.append(`temperament_tags[${index}]`, tag);
    });

    const photos = parseList(form.photosText);
    photos.forEach((photo, index) => {
      formDataObj.append(`photos[${index}]`, photo);
    });

    const personalityTraits = parseList(form.personalityTraitsText);
    personalityTraits.forEach((trait, index) => {
      formDataObj.append(`personality_traits[${index}]`, trait);
    });

    const goodWith = parseList(form.goodWithText);
    goodWith.forEach((item, index) => {
      formDataObj.append(`good_with[${index}]`, item);
    });

    const notGoodWith = parseList(form.notGoodWithText);
    notGoodWith.forEach((item, index) => {
      formDataObj.append(`not_good_with[${index}]`, item);
    });

    // Add contact information with bracket notation
    formDataObj.append('contact[name]', form.contact_name);
    formDataObj.append('contact[phone]', form.contact_phone);
    formDataObj.append('contact[email]', form.contact_email);
    if (form.contact_website) formDataObj.append('contact[website]', form.contact_website);
    formDataObj.append('contact[address]', form.contact_address);
    if (form.contact_hours) formDataObj.append('contact[hours]', form.contact_hours);

    // Add medical history - only non-empty records
    const filteredMedicalHistory = medicalHistory.filter((record) => record.type && record.description);
    if (filteredMedicalHistory.length > 0) {
      filteredMedicalHistory.forEach((record, index) => {
        if (record.date) formDataObj.append(`medical_history[${index}][date]`, record.date);
        formDataObj.append(`medical_history[${index}][type]`, record.type);
        formDataObj.append(`medical_history[${index}][description]`, record.description);
        if (record.vet) formDataObj.append(`medical_history[${index}][vet]`, record.vet);
        if (record.notes) formDataObj.append(`medical_history[${index}][notes]`, record.notes);
      });
    }

    router.post('/post-pet', formDataObj as unknown as Record<string, unknown>, {
      onFinish: () => setIsSubmitting(false),
    });
  };

  return (
    <>
      <Head title="Rehome A Pet for Adoption" />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="content-wrapper pt-28 pb-20">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl text-foreground">Rehome A Pet for Adoption</h1>
              <p className="mt-2 text-muted-foreground">Fill in the details below to publish a new pet listing.</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/pets">Back to Pets</Link>
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {Object.keys(pageErrors).length > 0 && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 space-y-2">
                <h3 className="font-semibold text-destructive">Submission Errors</h3>
                {Object.entries(pageErrors).map(([key, message]) => (
                  <p key={key} className="text-sm text-destructive/80">{message}</p>
                ))}
              </div>
            )}
            
            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-display">Basic Info</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input 
                  className="h-10 rounded-md border bg-background px-3" 
                  placeholder="Name" 
                  value={form.name} 
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} 
                />
                
                <select 
                  className="h-10 rounded-md border bg-background px-3 text-foreground"
                  value={form.breed} 
                  onChange={(e) => setForm((p) => ({ ...p, breed: e.target.value }))}
                  disabled={!form.species}
                >
                  <option value="" disabled>Select Breed</option>
                  {availableBreeds.map((breed) => (
                    <option key={breed} value={breed}>{breed}</option>
                  ))}
                </select>

                <select 
                  className="h-10 rounded-md border bg-background px-3 text-foreground"
                  value={form.species} 
                  onChange={(e) => setForm((p) => ({ ...p, species: e.target.value }))}
                >
                  <option value="" disabled>Select Species</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                </select>

                <input 
                  type="number" 
                  min={0} 
                  className="h-10 rounded-md border bg-background px-3" 
                  placeholder="Age" 
                  value={form.age} 
                  onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))} 
                />

                <select 
                  className="h-10 rounded-md border bg-background px-3 text-foreground"
                  value={form.gender} 
                  onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                >
                  <option value="" disabled>Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Unknown">Unknown</option>
                </select>

                <select 
                  className="h-10 rounded-md border bg-background px-3 text-foreground"
                  value={form.size} 
                  onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))}
                >
                  <option value="" disabled>Select Size</option>
                  <option value="Small">Small</option>
                  <option value="Medium">Medium</option>
                  <option value="Large">Large</option>
                  <option value="Extra Large">Extra Large</option>
                </select>

                <input 
                  className="h-10 rounded-md border bg-background px-3" 
                  placeholder="Medical Status" 
                  value={form.medical_status} 
                  onChange={(e) => setForm((p) => ({ ...p, medical_status: e.target.value }))} 
                />

                <input 
                  type="number" 
                  min={0} 
                  className="h-10 rounded-md border bg-background px-3" 
                  placeholder="Adoption Fee" 
                  value={form.adoption_fee} 
                  onChange={(e) => setForm((p) => ({ ...p, adoption_fee: Number(e.target.value) }))} 
                />

                <div className="relative">
                  <input 
                    className="h-10 rounded-md border bg-background px-3 w-full" 
                    placeholder="Shelter Name" 
                    list="shelter-options"
                    value={form.shelter_name} 
                    onChange={(e) => setForm((p) => ({ ...p, shelter_name: e.target.value }))} 
                  />
                  <datalist id="shelter-options">
                    {shelterNames.map((shelter) => (
                      <option key={shelter} value={shelter} />
                    ))}
                  </datalist>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      className="h-10 rounded-md border bg-background px-3 flex-1 file:mr-4 file:py-1 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer" 
                      onChange={handleImageChange}
                    />
                    {(imagePreview || form.image_url) && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="h-10 px-3 rounded-md border bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="relative w-full h-32 rounded-md border overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <input 
                    className="h-10 rounded-md border bg-background px-3" 
                    placeholder="Or paste Image URL" 
                    value={form.image_url} 
                    onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} 
                  />
                </div>
              </div>
              <textarea 
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2" 
                placeholder="Description" 
                value={form.description} 
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} 
              />
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-display">Temperament Tags</h2>
              <div className="flex flex-wrap gap-2">
                {temperamentOptions.map((tag) => {
                  const active = form.temperament_tags.includes(tag);
                  return (
                    <button
                      type="button"
                      key={tag}
                      onClick={() => toggleTemperament(tag)}
                      className={`rounded-full border px-3 py-1 text-sm ${active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-display">Additional Details</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Photos URLs (comma-separated)" value={form.photosText} onChange={(e) => setForm((p) => ({ ...p, photosText: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Personality traits (comma-separated)" value={form.personalityTraitsText} onChange={(e) => setForm((p) => ({ ...p, personalityTraitsText: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Good with (comma-separated)" value={form.goodWithText} onChange={(e) => setForm((p) => ({ ...p, goodWithText: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Not good with (comma-separated)" value={form.notGoodWithText} onChange={(e) => setForm((p) => ({ ...p, notGoodWithText: e.target.value }))} />
              </div>
              <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2" placeholder="Special needs" value={form.special_needs} onChange={(e) => setForm((p) => ({ ...p, special_needs: e.target.value }))} />
              <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2" placeholder="Dietary needs" value={form.dietary_needs} onChange={(e) => setForm((p) => ({ ...p, dietary_needs: e.target.value }))} />
              <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2" placeholder="Exercise requirements" value={form.exercise_requirements} onChange={(e) => setForm((p) => ({ ...p, exercise_requirements: e.target.value }))} />
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <h2 className="text-xl font-display">Shelter / Contact Info</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Contact name" value={form.contact_name} onChange={(e) => setForm((p) => ({ ...p, contact_name: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Phone" value={form.contact_phone} onChange={(e) => setForm((p) => ({ ...p, contact_phone: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Email" value={form.contact_email} onChange={(e) => setForm((p) => ({ ...p, contact_email: e.target.value }))} />
                <input className="h-10 rounded-md border bg-background px-3" placeholder="Website" value={form.contact_website} onChange={(e) => setForm((p) => ({ ...p, contact_website: e.target.value }))} />
              </div>
              <textarea className="min-h-20 w-full rounded-md border bg-background px-3 py-2" placeholder="Address" value={form.contact_address} onChange={(e) => setForm((p) => ({ ...p, contact_address: e.target.value }))} />
              <input className="h-10 w-full rounded-md border bg-background px-3" placeholder="Hours" value={form.contact_hours} onChange={(e) => setForm((p) => ({ ...p, contact_hours: e.target.value }))} />
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display">Medical History</h2>
                <Button type="button" variant="outline" onClick={addMedicalRecord}>Add Record</Button>
              </div>

              {medicalHistory.map((record, index) => (
                <div key={index} className="rounded-xl border border-border p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <input type="date" className="h-10 rounded-md border bg-background px-3" value={record.date} onChange={(e) => updateMedicalRecord(index, 'date', e.target.value)} />
                    <input className="h-10 rounded-md border bg-background px-3" placeholder="Type" value={record.type} onChange={(e) => updateMedicalRecord(index, 'type', e.target.value)} />
                    <input className="h-10 rounded-md border bg-background px-3" placeholder="Vet" value={record.vet} onChange={(e) => updateMedicalRecord(index, 'vet', e.target.value)} />
                  </div>
                  <textarea className="min-h-16 w-full rounded-md border bg-background px-3 py-2" placeholder="Description" value={record.description} onChange={(e) => updateMedicalRecord(index, 'description', e.target.value)} />
                  <textarea className="min-h-16 w-full rounded-md border bg-background px-3 py-2" placeholder="Notes" value={record.notes} onChange={(e) => updateMedicalRecord(index, 'notes', e.target.value)} />
                  {medicalHistory.length > 1 && (
                    <Button type="button" variant="outline" onClick={() => removeMedicalRecord(index)}>Remove</Button>
                  )}
                </div>
              ))}
            </section>

            {Object.keys(pageErrors).length > 0 && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
                {Object.entries(pageErrors).map(([key, value]) => (
                  <div key={key}>{value}</div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!canSubmit || isSubmitting} variant="default">
                {isSubmitting ? 'Publishing...' : 'Post Pet'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/pets">Cancel</Link>
              </Button>
            </div>
          </form>
        </main>
      </div>
    </>
  );
}
