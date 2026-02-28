import React, { useMemo } from "react";
import { Head, Link, router, usePage } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Info, ArrowLeft, ExternalLink } from "lucide-react";
import type { MatchResult } from "@/types/pet";

export default function Matches() {
  const { props } = usePage();
  
  // Inertia passes the 'results' query param into props
  const rawResults = (props as any).results;
  
  // Safely parse the results from the Quiz
  const results = useMemo<MatchResult[]>(() => {
    if (!rawResults) return [];
    try {
      // If it's a string (from JSON.stringify), parse it. Otherwise, use as is.
      return typeof rawResults === 'string' ? JSON.parse(rawResults) : rawResults;
    } catch (e) {
      console.error("Failed to parse results", e);
      return [];
    }
  }, [rawResults]);

  if (results.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Navbar />
        <div className="text-center mt-20">
          <h2 className="text-2xl font-display mb-4">No matches found!</h2>
          <p className="text-muted-foreground mb-8">Try taking the quiz again with different preferences.</p>
          <Link href="/quiz">
            <Button className="rounded-full px-8">Take the Quiz</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head title="Your Top Matches | PawsConnect" />
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="container mx-auto px-4 pt-32 pb-20 max-w-5xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <Link href="/quiz" className="text-primary flex items-center gap-2 mb-2 hover:underline font-medium">
                <ArrowLeft className="w-4 h-4" /> Retake Quiz
              </Link>
              <h1 className="text-4xl font-display">Your Perfect Matches</h1>
              <p className="text-muted-foreground mt-2">
                We've analyzed your lifestyle and found these furry friends who would fit right in.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10">
            {results.map((match, index) => (
              <motion.div
                key={match.pet.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="bg-card rounded-[2rem] border border-border overflow-hidden flex flex-col md:flex-row group hover:shadow-xl transition-shadow duration-300"
              >
                {/* Pet Image Section */}
                <div className="w-full md:w-80 h-72 md:h-auto relative overflow-hidden">
                    <img 
                    src={match.pet.imageUrl} // This matches your interface!
                    alt={match.pet.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-bold shadow-lg backdrop-blur-sm">
                    {match.compatibilityScore}% Match
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-3xl font-display mb-1">{match.pet.name}</h2>
                      <p className="text-muted-foreground font-medium">
                        {match.pet.breed} • {match.pet.age} {match.pet.age === 1 ? 'year' : 'years'} old
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" className="rounded-full hover:bg-primary/10 transition-colors">
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full text-red-500 hover:bg-red-50 transition-colors border-red-100">
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Match Analysis Box */}
                  <div className="bg-primary/5 border border-primary/10 p-5 rounded-2xl mb-6">
                    <p className="text-foreground leading-relaxed italic text-sm md:text-base">
                      "{match.reasoning}"
                    </p>
                  </div>

                  {/* Highlights & Considerations */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-green-600 text-sm uppercase tracking-wider">
                        <Heart className="w-4 h-4" fill="currentColor" /> Why it works
                      </h4>
                      <ul className="space-y-2">
                        {match.highlights.map((h, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-foreground/80">
                            <span className="text-green-500 mt-0.5">✓</span> {h}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-bold flex items-center gap-2 text-amber-600 text-sm uppercase tracking-wider">
                        <Info className="w-4 h-4" /> Considerations
                      </h4>
                      <ul className="space-y-2">
                        {match.considerations.map((c, i) => (
                          <li key={i} className="text-sm flex items-start gap-2 text-foreground/80">
                            <span className="text-amber-500 mt-0.5">•</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-auto flex flex-col sm:flex-row gap-4">
                    <Button 
                      className="flex-1 rounded-full h-12 text-lg font-semibold shadow-md hover:shadow-lg transition-all"
                      onClick={() => router.visit(`/pets/${match.pet.id}`)}
                    >
                      Meet {match.pet.name} <ExternalLink className="ml-2 w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="flex-1 rounded-full h-12 text-lg border-2">
                      Save for Later
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}