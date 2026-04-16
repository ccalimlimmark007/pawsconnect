import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import type { Pet } from '@/types/pet';

export interface PetUpdatePayload {
  name?: string;
  species?: string;
  breed?: string;
  age?: number;
  age_unit?: 'months' | 'years';
  gender?: string;
  size?: string;
  color?: string | null;
  weight?: number | null;
  medical_status?: string;
  is_vetted?: boolean;
  availability_status?: boolean;
  adoption_fee?: number;
  shelter_name?: string;
  image?: File | null;
  image_url?: string | null;
  description?: string;
  temperament_tags?: string[];
  photos?: string[];
  personality_traits?: string[];
  good_with?: string[];
  not_good_with?: string[];
  special_needs?: string | null;
  dietary_needs?: string | null;
  exercise_requirements?: string | null;
  contact?: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string | null;
    address?: string;
    hours?: string | null;
  };
  medical_history?: Array<{
    date?: string | null;
    type?: string | null;
    description?: string | null;
    vet?: string | null;
    notes?: string | null;
  }>;
}

export interface UsePetEditReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  updatePet: (petId: string, data: PetUpdatePayload) => Promise<Pet | null>;
  deletePet: (petId: string) => Promise<boolean>;
  clearError: () => void;
  clearSuccess: () => void;
}

/**
 * Hook for updating pet information
 * Handles validation, file uploads, and API communication
 */
export function usePetEdit(): UsePetEditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { props } = usePage();

  const updatePet = async (petId: string, data: PetUpdatePayload): Promise<Pet | null> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Create FormData to handle file uploads
      const formData = new FormData();

      // Add all fields to FormData
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof PetUpdatePayload];

        if (value === undefined) {
          return; // Skip undefined values
        }

        if (value === null) {
          formData.append(key, '');
          return;
        }

        if (key === 'image' && value instanceof File) {
          formData.append(key, value);
          return;
        }

        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object') {
              Object.keys(item).forEach((nestedKey) => {
                formData.append(`${key}[${index}][${nestedKey}]`, String(item[nestedKey as keyof typeof item] ?? ''));
              });
            } else {
              formData.append(`${key}[${index}]`, String(item));
            }
          });
          return;
        }

        if (typeof value === 'object') {
          Object.keys(value).forEach((nestedKey) => {
            formData.append(`${key}[${nestedKey}]`, String(value[nestedKey as keyof typeof value] ?? ''));
          });
          return;
        }

        formData.append(key, String(value));
      });

      // Get CSRF token from Inertia props or meta tag
      const getCsrfToken = (): string => {
        // First try to get from Inertia props (Laravel convention)
        const csrfToken = (props as Record<string, unknown>).csrf_token as string | undefined;
        if (csrfToken) return csrfToken;

        // Fall back to meta tag
        const metaToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
        if (metaToken) return metaToken;

        return '';
      };

      // Make the API request
      const response = await fetch(`/api/pets/${petId}`, {
        method: 'PATCH',
        headers: {
          'X-CSRF-TOKEN': getCsrfToken(),
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        if (response.status === 404) {
          setError(errorData.message || 'Pet not found');
        } else if (response.status === 403) {
          setError(errorData.message || 'You do not have permission to edit this pet');
        } else if (response.status === 422) {
          // Validation errors
          const messages = Object.values(errorData.errors ?? {})
            .flat()
            .join(', ');
          setError(messages || 'Validation failed');
        } else {
          setError(errorData.message || 'Failed to update pet');
        }

        setLoading(false);
        return null;
      }

      const result = await response.json();
      setSuccess(true);
      setLoading(false);

      return result.pet || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setLoading(false);
      return null;
    }
  };

  const deletePet = async (petId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const csrfToken = (props as Record<string, unknown>).csrf_token as string | undefined;
      const metaToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content;
      const token = csrfToken || metaToken || '';

      const requestHeaders = {
        'Accept': 'application/json',
        'X-CSRF-TOKEN': token,
        'X-Requested-With': 'XMLHttpRequest',
      };

      const tryDeleteRequest = async (url: string, method: 'DELETE' | 'POST') => {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          credentials: 'include',
        });

        const contentType = response.headers.get('content-type') || '';
        const isJson = contentType.includes('application/json');
        const responseData = isJson ? await response.json() : null;

        return { response, responseData, isJson };
      };

      let { response, responseData, isJson } = await tryDeleteRequest(`/api/pets/${petId}`, 'DELETE');

      // Fallback for environments that block/override DELETE requests.
      if (!response.ok && [404, 405, 419].includes(response.status)) {
        ({ response, responseData, isJson } = await tryDeleteRequest(`/api/pets/${petId}/delete`, 'POST'));
      }

      if (!isJson) {
        setError('Delete request failed: server returned an unexpected response format.');
        setLoading(false);
        return false;
      }

      if (!response.ok) {
        const errorData = responseData ?? {};

        if (response.status === 404) {
          setError((errorData as { message?: string }).message || 'Pet not found');
        } else if (response.status === 403) {
          setError((errorData as { message?: string }).message || 'You do not have permission to delete this pet');
        } else if (response.status === 401) {
          setError((errorData as { message?: string }).message || 'Please log in again and try deleting the pet');
        } else {
          setError((errorData as { message?: string }).message || 'Failed to delete pet');
        }

        setLoading(false);
        return false;
      }

      setSuccess(true);
      setLoading(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
      setLoading(false);
      return false;
    }
  };

  const clearError = () => setError(null);
  const clearSuccess = () => setSuccess(false);

  return {
    loading,
    error,
    success,
    updatePet,
    deletePet,
    clearError,
    clearSuccess,
  };
}
