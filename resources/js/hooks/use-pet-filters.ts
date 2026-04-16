import { useState, useEffect, useCallback } from 'react';
import type { Pet } from '@/types/pet';

export interface PetFilters {
  q?: string;
  species?: string[];
  breed?: string[];
  gender?: string;
  size?: string[];
  age_min?: number;
  age_max?: number;
  is_vetted?: boolean;
  available_only?: boolean;
  sort_by?: 'date_posted' | 'age' | 'name';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface PaginationInfo {
  total_results: number;
  page: number;
  per_page: number;
  last_page: number;
}

export interface PetFiltersResponse {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  refetch: () => void;
}

export interface PetStatsResponse {
  available_pets: number;
  total_pets: number;
  by_species: Record<string, number>;
  top_breeds: Record<string, number>;
}

/**
 * Hook for fetching filtered and paginated pets
 * 
 * @example
 * const { pets, loading, pagination } = usePetFilters({
 *   species: ['Dog'],
 *   size: ['Medium', 'Large'],
 *   age_min: 1,
 *   age_max: 5,
 *   sort_by: 'age',
 *   page: 1
 * });
 */
export function usePetFilters(filters: PetFilters = {}): PetFiltersResponse {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();

      // Add filters to params
      if (filters.q) params.append('q', filters.q);
      if (filters.species?.length) params.append('species', filters.species.join(','));
      if (filters.breed?.length) params.append('breed', filters.breed.join(','));
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.size?.length) params.append('size', filters.size.join(','));
      if (filters.age_min !== undefined) params.append('age_min', String(filters.age_min));
      if (filters.age_max !== undefined) params.append('age_max', String(filters.age_max));
      if (filters.is_vetted !== undefined) params.append('is_vetted', String(filters.is_vetted));
      if (filters.available_only !== undefined) params.append('available_only', String(filters.available_only));
      if (filters.sort_by) params.append('sort_by', filters.sort_by);
      if (filters.sort_order) params.append('sort_order', filters.sort_order);
      if (filters.page) params.append('page', String(filters.page));
      if (filters.limit) params.append('limit', String(filters.limit));

      const response = await fetch(`/api/pets?${params.toString()}`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setPets(data.data);
      setPagination({
        total_results: data.total_results,
        page: data.page,
        per_page: data.per_page,
        last_page: data.last_page,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching pets:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  return {
    pets,
    loading,
    error,
    pagination,
    refetch: fetchPets,
  };
}

/**
 * Hook for fetching pet statistics
 * 
 * @example
 * const { stats, loading } = usePetStats();
 * console.log(`${stats?.available_pets} Pets Available Today`);
 */
export function usePetStats() {
  const [stats, setStats] = useState<PetStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/pets/stats', {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching pet stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
