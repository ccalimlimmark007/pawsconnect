import React, { useState } from "react";
import { Head, Link, usePage } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { PetCard } from "@/components/pets/PetCard";
import { Search, Filter, SlidersHorizontal, CirclePlus, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePetFilters, usePetStats } from "@/hooks/use-pet-filters";

export default function Index() {
  const { props } = usePage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({});
  const [showSpeciesFilter, setShowSpeciesFilter] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch filtered pets from API
  const { pets, loading, pagination, error } = usePetFilters({
    q: searchQuery,
    species: selectedSpecies.length > 0 ? selectedSpecies : undefined,
    size: selectedSizes.length > 0 ? selectedSizes : undefined,
    age_min: ageRange.min,
    age_max: ageRange.max,
    page: currentPage,
    limit: 12,
  });

  // Fetch statistics
  const { stats } = usePetStats();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const toggleSpecies = (species: string) => {
    setSelectedSpecies(prev =>
      prev.includes(species)
        ? prev.filter(s => s !== species)
        : [...prev, species]
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

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSpecies([]);
    setSelectedSizes([]);
    setAgeRange({});
    setCurrentPage(1);
    setShowAdvancedFilter(false);
  };

  const hasActiveFilters = searchQuery || selectedSpecies.length > 0 || selectedSizes.length > 0 || ageRange.min || ageRange.max;

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

          {Boolean((props.auth as { user?: unknown })?.user) && (
            <div className="mb-6">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 hover:shadow-lg hover:scale-105">
                <Link href="/post-pet" className="flex items-center justify-center">
                  <CirclePlus className="w-4 h-4 mr-2" />
                  Rehome A Pet for Adoption
                </Link>
              </Button>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
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
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowSpeciesFilter(!showSpeciesFilter)}
                >
                  <Filter className="w-4 h-4" />
                  Species {selectedSpecies.length > 0 && `(${selectedSpecies.length})`}
                </Button>
                {showSpeciesFilter && (
                  <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg p-4 z-50 min-w-[200px]">
                    <div className="space-y-2">
                      {['Dog', 'Cat'].map(species => (
                        <label key={species} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedSpecies.includes(species)}
                            onChange={() => toggleSpecies(species)}
                            className="rounded"
                          />
                          <span className="text-sm">{species}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
                {showAdvancedFilter && (
                  <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg p-6 z-50 min-w-[300px] space-y-6">
                    {/* Size Filter */}
                    <div>
                      <h4 className="font-semibold mb-3">Size</h4>
                      <div className="space-y-2">
                        {['Small', 'Medium', 'Large', 'Extra Large'].map(size => (
                          <label key={size} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedSizes.includes(size)}
                              onChange={() => toggleSize(size)}
                              className="rounded"
                            />
                            <span className="text-sm">{size}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Age Range Filter */}
                    <div>
                      <h4 className="font-semibold mb-3">Age Range</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Minimum Age</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Min age"
                            value={ageRange.min || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setAgeRange(prev => ({ ...prev, min: value }));
                              setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Maximum Age</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Max age"
                            value={ageRange.max || ''}
                            onChange={(e) => {
                              const value = e.target.value ? parseInt(e.target.value) : undefined;
                              setAgeRange(prev => ({ ...prev, max: value }));
                              setCurrentPage(1);
                            }}
                            className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearAllFilters}
                      className="w-full"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Filters:</span>
              {selectedSpecies.map(species => (
                <button
                  key={species}
                  onClick={() => toggleSpecies(species)}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {species}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {selectedSizes.map(size => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {size}
                  <X className="w-3 h-3" />
                </button>
              ))}
              {(ageRange.min || ageRange.max) && (
                <button
                  onClick={() => {
                    setAgeRange({});
                    setCurrentPage(1);
                  }}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  Age: {ageRange.min || '0'}-{ageRange.max || '50'}
                  <X className="w-3 h-3" />
                </button>
              )}
              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  "{searchQuery}"
                  <X className="w-3 h-3" />
                </button>
              )}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {pets.map((pet, index) => (
                  <PetCard key={pet.id} pet={pet} index={index} />
                ))}
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === pagination.last_page}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && pets.length === 0 && (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <h3 className="text-xl font-display">No furry friends found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              <Button 
                variant="link" 
                onClick={clearAllFilters}
                className="mt-4 text-primary"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}