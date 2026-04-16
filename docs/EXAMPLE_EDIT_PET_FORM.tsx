import { X, Upload } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { usePetEdit, type PetUpdatePayload } from '@/hooks/use-pet-edit';
import type { Pet } from '@/types';

interface EditPetFormProps {
  pet: Pet;
  onSuccess?: (updatedPet: Pet) => void;
  onCancel?: () => void;
}

/**
 * Edit Pet Form Component
 * 
 * This component provides a complete form for editing pet information.
 * It handles:
 * - Form state management
 * - File uploads with preview
 * - Real-time validation feedback
 * - Error and success messaging
 * - API communication
 * 
 * Usage:
 * ```tsx
 * <EditPetForm 
 *   pet={petData}
 *   onSuccess={(updated) => console.log('Updated:', updated)}
 *   onCancel={() => setEditMode(false)}
 * />
 * ```
 */
export function EditPetForm({ pet, onSuccess, onCancel }: EditPetFormProps) {
  const { updatePet, loading, error, success, clearError, clearSuccess } = usePetEdit();

  // Form state
  const [formData, setFormData] = useState<PetUpdatePayload>({
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    age_unit: (pet.ageUnit || 'years') as 'months' | 'years',
    gender: pet.gender,
    size: pet.size,
    color: pet.color || '',
    weight: pet.weight || undefined,
    medical_status: pet.medicalStatus,
    is_vetted: pet.isVetted,
    availability_status: pet.availabilityStatus,
    adoption_fee: pet.adoptionFee,
    shelter_name: pet.shelterName,
    description: pet.description,
    temperament_tags: pet.temperamentTags || [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(pet.imageUrl || '');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Clear messages when they're shown
  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(clearSuccess, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, clearSuccess]);

  // Handle text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear validation error for this field
    setValidationErrors(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseFloat(value),
      }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle image upload
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

  // Clear selected image
  const clearImage = () => {
    setImageFile(null);
    setImagePreview(pet.imageUrl || '');
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = 'Pet name is required';
    }
    if (!formData.breed?.trim()) {
      errors.breed = 'Breed is required';
    }
    if (formData.age === undefined || formData.age < 0) {
      errors.age = 'Valid age is required';
    }
    if (formData.adoption_fee !== undefined && formData.adoption_fee < 0) {
      errors.adoption_fee = 'Adoption fee cannot be negative';
    }
    if (formData.weight && formData.weight < 0) {
      errors.weight = 'Weight cannot be negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Prepare data for submission
    const submitData: PetUpdatePayload = {
      ...formData,
      image: imageFile,
    };

    // Submit to API
    const result = await updatePet(pet.id, submitData);
    
    if (result) {
      onSuccess?.(result as Pet);
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 max-w-2xl">
      <h2 className="text-2xl font-semibold mb-6">Edit Pet Information</h2>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-100 border border-green-300 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200">
          Pet information updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium mb-3">Pet Photo</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="flex flex-col items-center justify-center w-full border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:bg-secondary/30 transition">
                <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload or drag and drop
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            {imagePreview && (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pet Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${
                validationErrors.name ? 'border-destructive' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="e.g., Buddy"
            />
            {validationErrors.name && (
              <p className="text-xs text-destructive mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Species</label>
            <select
              name="species"
              value={formData.species || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select species</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Breed *</label>
            <input
              type="text"
              name="breed"
              value={formData.breed || ''}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 rounded-lg border ${
                validationErrors.breed ? 'border-destructive' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="e.g., Golden Retriever"
            />
            {validationErrors.breed && (
              <p className="text-xs text-destructive mt-1">{validationErrors.breed}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Gender</label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age *</label>
            <input
              type="number"
              name="age"
              value={formData.age || ''}
              onChange={handleInputChange}
              min="0"
              max="100"
              className={`w-full px-3 py-2 rounded-lg border ${
                validationErrors.age ? 'border-destructive' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="0"
            />
            {validationErrors.age && (
              <p className="text-xs text-destructive mt-1">{validationErrors.age}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Age Unit</label>
            <select
              name="age_unit"
              value={formData.age_unit || 'years'}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="months">Months</option>
              <option value="years">Years</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Size</label>
            <select
              name="size"
              value={formData.size || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select size</option>
              <option value="Small">Small</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
              <option value="Extra Large">Extra Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Golden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Weight (lbs)</label>
            <input
              type="number"
              name="weight"
              value={formData.weight || ''}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0"
            />
            {validationErrors.weight && (
              <p className="text-xs text-destructive mt-1">{validationErrors.weight}</p>
            )}
          </div>
        </div>

        {/* Medical and Status Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Medical Status</label>
            <select
              name="medical_status"
              value={formData.medical_status || ''}
              onChange={handleInputChange}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select status</option>
              <option value="Healthy">Healthy</option>
              <option value="Under Treatment">Under Treatment</option>
              <option value="Special Needs">Special Needs</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Adoption Fee *</label>
            <input
              type="number"
              name="adoption_fee"
              value={formData.adoption_fee || ''}
              onChange={handleInputChange}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 rounded-lg border ${
                validationErrors.adoption_fee ? 'border-destructive' : 'border-border'
              } bg-background focus:outline-none focus:ring-2 focus:ring-primary/20`}
              placeholder="0"
            />
            {validationErrors.adoption_fee && (
              <p className="text-xs text-destructive mt-1">{validationErrors.adoption_fee}</p>
            )}
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_vetted"
              checked={formData.is_vetted ?? false}
              onChange={handleInputChange}
              className="rounded"
            />
            <span className="text-sm">Vetted</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="availability_status"
              checked={formData.availability_status ?? true}
              onChange={handleInputChange}
              className="rounded"
            />
            <span className="text-sm">Available for Adoption</span>
          </label>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Tell us about this pet..."
          />
        </div>

        {/* Form Actions */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Pet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
