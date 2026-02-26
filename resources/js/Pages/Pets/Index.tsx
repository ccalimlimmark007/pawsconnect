import React, { useState } from "react";
import { Head } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { PetCard } from "@/components/pets/PetCard";
import { mockPets } from "@/data/mockPets";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Index() {
  const [searchQuery, setSearchQuery] = useState("");

  // Filtering logic (Optional: filters by name or breed)
  const filteredPets = mockPets.filter(
    (pet) =>
      pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Head title="Find Your Match - PetCard" />
      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container mx-auto px-4 pt-32 pb-20">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-display text-foreground">
                Find Your New <span className="text-primary">Best Friend</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl font-body">
                Browse through our community of lovable pets waiting for their forever homes. 
                Every animal here is vetted and ready to meet you.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-4 py-2 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {mockPets.length} Pets Available Today
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
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Species
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </Button>
            </div>
          </div>

          {/* Pets Grid */}
          {filteredPets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPets.map((pet, index) => (
                <PetCard key={pet.id} pet={pet} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border">
              <h3 className="text-xl font-display">No furry friends found</h3>
              <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
              <Button 
                variant="link" 
                onClick={() => setSearchQuery("")}
                className="mt-4 text-primary"
              >
                Clear all searches
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
}