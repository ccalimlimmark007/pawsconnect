import React, { useState, useRef, useEffect, useCallback } from "react";
import { Head, Link, usePage, router } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { PetCard } from "@/components/pets/PetCard";
import { Pagination } from "@/components/ui/Pagination";
import { Search, Filter, SlidersHorizontal, X, Sparkles, PawPrint } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePetStats } from "@/hooks/use-pet-filters";
import type { Pet } from "@/types/pet";

interface PaginationMeta {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

interface Shelter {
  id: number;
  name: string;
}

interface Filters {
  q: string;
  species: string;
  breed: string;
  size: string;
  gender: string;
  shelter_id: string;
  age_min?: string | null;
  age_max?: string | null;
  adoption_fee_max?: string | null;
  browse_all?: string;
}

interface AdopterPreferences {
  species: string[];
  size: string[];
  home_type?: string | null;
  activity_level?: string | null;
  experience_level?: string | null;
}

interface MatchPet {
  id: string;
  name: string;
  species: string;
  breed: string;
  size: string;
  age: number;
  ageUnit: string;
  imageUrl: string | null;
  adoptionFee: number;
  score: number;
}

interface Props {
  pets: Pet[];
  pagination: PaginationMeta;
  filters: Filters;
  shelters: Shelter[];
  preferencesApplied?: boolean;
  adopterPreferences?: AdopterPreferences | null;
  matches?: MatchPet[];
}

function MatchCard({ match }: { match: MatchPet }) {
  return (
    <Link
      href={`/pets/${match.id}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <div className="relative aspect-square">
        {match.imageUrl ? (
          <img
            src={match.imageUrl}
            alt={match.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary">
            <PawPrint className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
        <div className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground shadow">
          {match.score}%
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold">{match.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {match.breed} · {match.size}
        </p>
        {match.adoptionFee > 0 && (
          <p className="mt-1 text-xs font-medium text-primary">
            ₱{match.adoptionFee.toLocaleString()}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function Index({ pets, pagination, filters, shelters, preferencesApplied, adopterPreferences, matches }: Props) {
  const { props } = usePage();

  const [browseAll, setBrowseAll] = useState(filters.browse_all === '1');
  const [searchQuery, setSearchQuery] = useState(filters.q ?? "");
  const [selectedSpecies, setSelectedSpecies] = useState<string[]>(
    filters.species ? filters.species.split(",").filter(Boolean) : []
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    filters.size ? filters.size.split(",").filter(Boolean) : []
  );
  const [selectedGenders, setSelectedGenders] = useState<string[]>(
    filters.gender ? filters.gender.split(",").filter(Boolean) : []
  );
  const [breedSearch, setBreedSearch] = useState(filters.breed ?? "");
  const [selectedShelter, setSelectedShelter] = useState(filters.shelter_id ?? "");
  const [adoptionFeeMax, setAdoptionFeeMax] = useState(filters.adoption_fee_max ?? "");
  const [ageRange, setAgeRange] = useState<{ min?: number; max?: number }>({
    min: filters.age_min ? parseInt(filters.age_min) : undefined,
    max: filters.age_max ? parseInt(filters.age_max) : undefined,
  });
  const [showSpeciesFilter, setShowSpeciesFilter] = useState(false);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);

  const { stats } = usePetStats();

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildParams = useCallback(
    (overrides: Partial<{
      q: string;
      species: string[];
      breed: string;
      size: string[];
      gender: string[];
      shelter_id: string;
      adoption_fee_max: string;
      age_min?: number;
      age_max?: number;
      page: number;
    }> = {}) => {
      const q            = overrides.q ?? searchQuery;
      const species      = overrides.species ?? selectedSpecies;
      const breed        = "breed" in overrides ? (overrides.breed ?? "") : breedSearch;
      const size         = overrides.size ?? selectedSizes;
      const gender       = overrides.gender ?? selectedGenders;
      const shelter_id   = "shelter_id" in overrides ? (overrides.shelter_id ?? "") : selectedShelter;
      const fee_max      = "adoption_fee_max" in overrides ? (overrides.adoption_fee_max ?? "") : adoptionFeeMax;
      const age_min      = "age_min" in overrides ? overrides.age_min : ageRange.min;
      const age_max      = "age_max" in overrides ? overrides.age_max : ageRange.max;
      const page         = overrides.page ?? 1;

      const params: Record<string, string | number | undefined> = {};
      if (q)                      params.q                = q;
      if (species.length)         params.species          = species.join(",");
      if (breed)                  params.breed            = breed;
      if (size.length)            params.size             = size.join(",");
      if (gender.length)          params.gender           = gender.join(",");
      if (shelter_id)             params.shelter_id       = shelter_id;
      if (fee_max)                params.adoption_fee_max = fee_max;
      if (age_min !== undefined)  params.age_min          = age_min;
      if (age_max !== undefined)  params.age_max          = age_max;
      if (page > 1)               params.page             = page;
      if (browseAll)              params.browse_all       = '1';

      return params;
    },
    [searchQuery, selectedSpecies, breedSearch, selectedSizes, selectedGenders, selectedShelter, adoptionFeeMax, ageRange]
  );

  const navigate = useCallback(
    (params: Record<string, string | number | undefined>) => {
      router.get("/pets", params, { preserveScroll: false, replace: false });
    },
    []
  );

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      navigate(buildParams({ q: value, page: 1 }));
    }, 350);
  };

  const handleBreedSearch = (value: string) => {
    setBreedSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      navigate(buildParams({ breed: value, page: 1 }));
    }, 350);
  };

  const toggleSpecies = (species: string) => {
    const next = selectedSpecies.includes(species)
      ? selectedSpecies.filter((s) => s !== species)
      : [...selectedSpecies, species];
    setSelectedSpecies(next);
    navigate(buildParams({ species: next, page: 1 }));
  };

  const toggleSize = (size: string) => {
    const next = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    setSelectedSizes(next);
    navigate(buildParams({ size: next, page: 1 }));
  };

  const toggleGender = (gender: string) => {
    const next = selectedGenders.includes(gender)
      ? selectedGenders.filter((g) => g !== gender)
      : [...selectedGenders, gender];
    setSelectedGenders(next);
    navigate(buildParams({ gender: next, page: 1 }));
  };

  const handleShelterChange = (value: string) => {
    setSelectedShelter(value);
    navigate(buildParams({ shelter_id: value, page: 1 }));
  };

  const handleAdoptionFeeMax = (value: string) => {
    setAdoptionFeeMax(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      navigate(buildParams({ adoption_fee_max: value, page: 1 }));
    }, 350);
  };

  const handleAgeChange = (field: "min" | "max", raw: string) => {
    const value = raw ? parseInt(raw) : undefined;
    const next = { ...ageRange, [field]: value };
    setAgeRange(next);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      navigate(buildParams({ age_min: next.min, age_max: next.max, page: 1 }));
    }, 350);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedSpecies([]);
    setSelectedSizes([]);
    setSelectedGenders([]);
    setBreedSearch("");
    setSelectedShelter("");
    setAdoptionFeeMax("");
    setAgeRange({});
    setShowAdvancedFilter(false);
    setBrowseAll(true);
    navigate({ browse_all: '1' });
  };

  const handlePageChange = (page: number) => {
    navigate(buildParams({ page }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const advancedFilterActive =
    selectedSizes.length > 0 ||
    selectedGenders.length > 0 ||
    breedSearch ||
    selectedShelter ||
    adoptionFeeMax ||
    ageRange.min !== undefined ||
    ageRange.max !== undefined;

  const hasActiveFilters =
    searchQuery ||
    selectedSpecies.length > 0 ||
    advancedFilterActive;

  return (
    <>
      <Head title="Find Your Match - PawsConnect" />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="content-wrapper pt-32 pb-20">
          {/* Header */}
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
              {stats?.available_pets ?? pagination.total} Pets Available Today
            </div>
          </div>

          {/* Best Matches for You */}
          {matches && matches.length > 0 && (
            <section className="mb-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 text-xl font-display font-semibold">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Best Matches for You
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Ranked by compatibility with your profile
                  </p>
                </div>
                <Link
                  href="/profile/preferences"
                  className="shrink-0 text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Edit preferences
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
              <div className="mt-6 border-t border-border" />
            </section>
          )}

          {/* Personalized results banner */}
          {preferencesApplied && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm font-medium text-primary">
                <Sparkles className="h-4 w-4 shrink-0" />
                Showing pets matched to your preferences
              </span>
              <div className="flex items-center gap-4 shrink-0">
                <Link
                  href="/profile/preferences"
                  className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                >
                  Edit preferences
                </Link>
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Browse all
                </button>
              </div>
            </div>
          )}

          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, breed, or description…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              {/* Species quick-filter */}
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
                  <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg p-4 z-50 min-w-44">
                    <div className="space-y-2">
                      {["Dog", "Cat", "Rabbit", "Bird", "Other"].map((species) => (
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

              {/* Advanced filter panel */}
              <div className="relative">
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                  {advancedFilterActive && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                </Button>

                {showAdvancedFilter && (
                  <div className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg shadow-lg p-6 z-50 w-80 space-y-6 max-h-[80vh] overflow-y-auto">

                    {/* Breed */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Breed</h4>
                      <input
                        type="text"
                        placeholder="e.g. Labrador, Siamese…"
                        value={breedSearch}
                        onChange={(e) => handleBreedSearch(e.target.value)}
                        className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                      />
                    </div>

                    {/* Gender */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Gender</h4>
                      <div className="space-y-2">
                        {["Male", "Female", "Unknown"].map((gender) => (
                          <label key={gender} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedGenders.includes(gender)}
                              onChange={() => toggleGender(gender)}
                              className="rounded"
                            />
                            <span className="text-sm">{gender}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Size */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Size</h4>
                      <div className="space-y-2">
                        {["Small", "Medium", "Large", "Extra Large"].map((size) => (
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

                    {/* Shelter */}
                    {shelters.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3 text-sm">Shelter</h4>
                        <select
                          value={selectedShelter}
                          onChange={(e) => handleShelterChange(e.target.value)}
                          className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                        >
                          <option value="">All Shelters</option>
                          {shelters.map((shelter) => (
                            <option key={shelter.id} value={String(shelter.id)}>
                              {shelter.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Age Range */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Age Range</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Min</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={ageRange.min ?? ""}
                            onChange={(e) => handleAgeChange("min", e.target.value)}
                            className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground mb-1 block">Max</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="Any"
                            value={ageRange.max ?? ""}
                            onChange={(e) => handleAgeChange("max", e.target.value)}
                            className="w-full px-3 py-2 rounded border border-border bg-background text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Max Adoption Fee */}
                    <div>
                      <h4 className="font-semibold mb-3 text-sm">Max Adoption Fee</h4>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₱</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="Any amount"
                          value={adoptionFeeMax}
                          onChange={(e) => handleAdoptionFeeMax(e.target.value)}
                          className="w-full pl-7 pr-3 py-2 rounded border border-border bg-background text-sm"
                        />
                      </div>
                    </div>

                    <Button variant="outline" size="sm" onClick={clearAllFilters} className="w-full">
                      Clear All Filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="mb-6 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-muted-foreground">Active filters:</span>

              {searchQuery && (
                <button
                  onClick={() => handleSearch("")}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  "{searchQuery}"
                  <X className="w-3 h-3" />
                </button>
              )}
              {selectedSpecies.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSpecies(s)}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {s} <X className="w-3 h-3" />
                </button>
              ))}
              {breedSearch && (
                <button
                  onClick={() => { setBreedSearch(""); navigate(buildParams({ breed: "", page: 1 })); }}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  Breed: {breedSearch} <X className="w-3 h-3" />
                </button>
              )}
              {selectedGenders.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGender(g)}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {g} <X className="w-3 h-3" />
                </button>
              ))}
              {selectedSizes.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleSize(s)}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {s} <X className="w-3 h-3" />
                </button>
              ))}
              {selectedShelter && (
                <button
                  onClick={() => handleShelterChange("")}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  {shelters.find((s) => String(s.id) === selectedShelter)?.name ?? "Shelter"}
                  <X className="w-3 h-3" />
                </button>
              )}
              {(ageRange.min !== undefined || ageRange.max !== undefined) && (
                <button
                  onClick={() => { setAgeRange({}); navigate(buildParams({ age_min: undefined, age_max: undefined, page: 1 })); }}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  Age: {ageRange.min ?? "0"}–{ageRange.max ?? "∞"} <X className="w-3 h-3" />
                </button>
              )}
              {adoptionFeeMax && (
                <button
                  onClick={() => { setAdoptionFeeMax(""); navigate(buildParams({ adoption_fee_max: "", page: 1 })); }}
                  className="flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80"
                >
                  Fee ≤ ₱{adoptionFeeMax} <X className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Result count */}
          {pagination.total > 0 && (
            <p className="text-sm text-muted-foreground mb-6">
              Showing {(pagination.current_page - 1) * pagination.per_page + 1}–
              {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{" "}
              {pagination.total} pets
            </p>
          )}

          {/* Pets Grid */}
          {pets.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {pets.map((pet, index) => (
                  <PetCard key={pet.id} pet={pet} index={index} />
                ))}
              </div>

              <Pagination
                currentPage={pagination.current_page}
                lastPage={pagination.last_page}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <h3 className="text-xl font-display">No furry friends found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              <Button variant="link" onClick={clearAllFilters} className="mt-4 text-primary">
                Clear all filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
