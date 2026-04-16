// Example: Updated Pets/Index.tsx using the new filtering API

import React, { useState } from "react";
import { Head, Link } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { PetCard } from "@/components/pets/PetCard";
import { Search, Filter, SlidersHorizontal, CirclePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePetFilters, usePetStats } from "@/hooks/use-pet-filters";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedBreeds, setSelectedBreeds] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({});
  const [sortBy, setSortBy] = useState<'date_posted' | 'age' | 'name'>('date_posted');
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch filtered pets
  const { pets, loading, pagination, error } = usePetFilters({
    q: searchQuery,
    species: selectedSpecies.length > 0 ? selectedSpecies : undefined,
    breed: selectedBreeds.length > 0 ? selectedBreeds : undefined,
    size: selectedSizes.length > 0 ? selectedSizes : undefined,
    age_min: ageRange.min,
    age_max: ageRange.max,
    sort_by: sortBy,
    page: currentPage,
    limit: 12,
  });

  // Fetch pet statistics
  const { stats } = usePetStats();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const toggleSpecies = (species: string) => {
    setSelectedSpecies(prev =>
      prev.includes(species)
        ? prev.filter(s => s !== species)
        : [...prev, species]
    );
    setCurrentPage(1);
  };

  const toggleBreed = (breed: string) => {
    setSelectedBreeds(prev =>
      prev.includes(breed)
        ? prev.filter(b => b !== breed)
        : [...prev, breed]
    );
    setCurrentPage(1);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size)
        ? prev.filter(s => s !== size)
        : [...prev, size]
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecies([]);
    setSelectedBreeds([]);
    setSelectedSizes([]);
    setAgeRange({});
    setCurrentPage(1);
  };

  return (
    <>
      <Head title="Find Your Match - PawsConnect" />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="content-wrapper pt-32 pb-20">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display text-foreground">
                Find Your New <span className="text-primary">Best Friend</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl font-body">
                Browse through our community of lovable pets waiting for their forever homes.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {stats?.available_pets || 0} Pets Available Today
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-10">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by breed, personality, or name..."
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => toggleSpecies('Dog')}
              >
                <Filter className="w-4 h-4" />
                Dogs {selectedSpecies.includes('Dog') && '✓'}
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => toggleSpecies('Cat')}
              >
                <Filter className="w-4 h-4" />
                Cats {selectedSpecies.includes('Cat') && '✓'}
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                More Filters
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          {(selectedSpecies.length > 0 || selectedBreeds.length > 0 || selectedSizes.length > 0) && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedSpecies.map(species => (
                <Button
                  key={species}
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleSpecies(species)}
                >
                  {species} ×
                </Button>
              ))}
              {selectedBreeds.map(breed => (
                <Button
                  key={breed}
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleBreed(breed)}
                >
                  {breed} ×
                </Button>
              ))}
              {selectedSizes.map(size => (
                <Button
                  key={size}
                  variant="secondary"
                  size="sm"
                  onClick={() => toggleSize(size)}
                >
                  {size} ×
                </Button>
              ))}
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Loading pets...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20 bg-destructive/10 rounded-3xl border border-destructive/20">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Pets Grid */}
          {!loading && !error && pets.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {pets.map((pet, index) => (
                  <PetCard key={pet.id} pet={pet} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="mt-12 flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage === pagination.last_page}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && pets.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <h3 className="text-xl font-display">No furry friends found</h3>
              <p className="text-muted-foreground mt-2">
                Try adjusting your search or filters.
              </p>
              <Button variant="link" onClick={clearFilters} className="mt-4 text-primary">
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
