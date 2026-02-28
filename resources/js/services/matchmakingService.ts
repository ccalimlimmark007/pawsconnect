import { mockPets } from "@/data/mockPets";
import type { Pet, MatchResult } from "@/types/pet";

// 1. Define the QuizAnswers interface (to fix the 'existing_pets' error)
export interface QuizAnswers {
  housing?: string;
  children?: string;
  existing_pets?: string[]; // Ensure this is here!
  activity?: string;
  work?: string;
  species?: string[];
  size?: string[];
  age?: string;
  experience?: string;
  energy?: string;
}

// 2. Define a simple Profile interface so the code knows what 'profile' is
export interface AdopterProfile {
  id?: string;
  preferences?: {
    species?: string[];
    sizePreference?: string[];
  };
}

interface MatchAnalysis {
  compatibility_score: number;
  reasoning: string;
  highlights: string[];
  considerations: string[];
}

// Simulated AI reasoning templates
const reasoningTemplates = {
  excellent: [
    "{petName}'s {trait} personality aligns perfectly with your {lifestyle}. This match shows exceptional compatibility across all key factors.",
    "Based on your lifestyle quiz, {petName} is an ideal companion. Their {trait} nature complements your {lifestyle} beautifully.",
    "Our analysis shows {petName} would thrive in your home. Their temperament and your preferences create an outstanding match.",
  ],
  good: [
    "{petName}'s {trait} demeanor makes them a strong candidate for your household. While not perfect, the compatibility is notably high.",
    "Your lifestyle aligns well with {petName}'s needs. Their {trait} nature would adapt nicely to your {lifestyle}.",
    "{petName} shows strong potential as your companion. Their characteristics complement most of your stated preferences.",
  ],
  moderate: [
    "{petName} could be a good fit with some adjustments. Their {trait} nature may require adaptation to your {lifestyle}.",
    "While {petName} isn't a perfect match, their {trait} temperament offers potential. Consider the listed factors carefully.",
    "Our analysis suggests {petName} as a moderate match. Some lifestyle adjustments may enhance compatibility.",
  ],
  low: [
    "{petName} may face challenges adapting to your lifestyle. Consider the recommendations below for better alternatives.",
    "Based on your quiz responses, {petName}'s needs may not align with your current situation.",
    "While {petName} is lovely, our analysis suggests exploring other options that better match your preferences.",
  ],
};

function calculateCompatibility(pet: Pet, answers: QuizAnswers): MatchAnalysis {
  // --- ADD THIS BLOCK START ---
  // Create a normalized version of answers so casing doesn't break our logic
  const normalized = {
    housing: answers.housing?.toLowerCase(),
    activity: answers.activity?.toLowerCase(),
    experience: answers.experience?.toLowerCase(),
    work: answers.work?.toLowerCase(),
    species: answers.species?.map(s => s.toLowerCase()) || [],
  };
  // --- ADD THIS BLOCK END ---

  let score = 50; 
  const highlights: string[] = [];
  const considerations: string[] = [];

  // 1. Housing compatibility (Use 'normalized.housing' instead of 'answers.housing')
  if (normalized.housing) {
    if (normalized.housing === "house with yard") { // Check lowercase
      if (pet.size === "Large" || pet.temperamentTags.includes("High Energy")) {
        score += 15;
        highlights.push("Your yard provides excellent space for exercise");
      }
    } else if (normalized.housing === "apartment" || normalized.housing === "condo") {
      if (pet.size === "Small" && pet.temperamentTags.includes("Calm")) {
        score += 12;
        highlights.push("Perfect for apartment living");
      } else if (pet.size === "Large" || pet.temperamentTags.includes("High Energy")) {
        score -= 15;
        considerations.push("May need extra outdoor time in apartment setting");
      }
    }
  }

  // Housing compatibility
  if (answers.housing) {
 if (answers.housing === "House with Yard") {
      if (pet.size === "Large" || pet.temperamentTags.includes("High Energy")) {
        score += 15;
        highlights.push("Your yard provides excellent space for exercise");
      }
    } else if (answers.housing === "apartment" || answers.housing === "condo") {
      if (pet.size === "Small" && pet.temperamentTags.includes("Calm")) {
        score += 12;
        highlights.push("Perfect for apartment living");
      } else if (pet.size === "Large" || pet.temperamentTags.includes("High Energy")) {
        score -= 15;
        considerations.push("May need extra outdoor time in apartment setting");
      }
    }
  }

  // Children compatibility
  if (answers.children && answers.children !== "no") {
    if (pet.temperamentTags.includes("Good with Kids")) {
      score += 15;
      highlights.push("Excellent with children");
    } else if (pet.temperamentTags.includes("High Energy") && answers.children === "toddlers") {
      score -= 10;
      considerations.push("High energy may be overwhelming for toddlers");
    }
  }

  // Existing pets compatibility
  if (answers.existing_pets && !answers.existing_pets.includes("none")) {
    if (pet.temperamentTags.includes("Good with Pets")) {
      score += 12;
      highlights.push("Gets along well with other pets");
    } else {
      score -= 8;
      considerations.push("May need slow introduction to existing pets");
    }
  }

  // Activity level matching
  if (answers.activity) {
    const petEnergy = pet.temperamentTags.includes("High Energy") ? "high" : 
                      pet.temperamentTags.includes("Calm") ? "low" : "moderate";
    
    if ((answers.activity === "high" || answers.activity === "very_high") && petEnergy === "high") {
      score += 15;
      highlights.push("Energy levels are a perfect match");
    } else if ((answers.activity === "low" || answers.activity === "moderate") && petEnergy === "low") {
      score += 15;
      highlights.push("Calm temperament suits your relaxed lifestyle");
    } else if (Math.abs(["low", "moderate", "high"].indexOf(answers.activity) - 
                        ["low", "moderate", "high"].indexOf(petEnergy)) > 1) {
      score -= 10;
      considerations.push("Activity level differences may require adjustment");
    }
  }

  // Work schedule compatibility
  if (answers.work) {
    if (answers.work === "home" || answers.work === "flexible") {
      score += 8;
      highlights.push("Your schedule allows for quality bonding time");
    } else if (answers.work === "full_away" && pet.species === "Dog") {
      if (!pet.temperamentTags.includes("Trained")) {
        score -= 8;
        considerations.push("Dogs need attention during work hours");
      }
    }
  }

  // Species preference
// 1. Convert everything to lowercase for the check to avoid Case Sensitivity issues
const normalizedSpecies = answers.species?.map(s => s.toLowerCase()) || [];

if (normalizedSpecies.length > 0 && !normalizedSpecies.includes("any")) {
    // This map handles the translation to your Pet.ts Species types
    const speciesMap: Record<string, string> = { 
        dog: "Dog", 
        cat: "Cat", 
        rabbit: "Rabbit",
        bird: "Bird"
    };

    const preferredSpecies = normalizedSpecies.map(s => speciesMap[s] || s);

    // We check if the pet's species (e.g., "Dog") is in our preferred list
    if (preferredSpecies.includes(pet.species)) {
        score += 10;
    } else {
        score -= 20;
    }
}

  // Size preference
  if (answers.size && answers.size.length > 0 && !answers.size.includes("any")) {
    const sizeMap: Record<string, string> = { small: "Small", medium: "Medium", large: "Large" };
    const preferredSizes = answers.size.map(s => sizeMap[s] || s);
    if (preferredSizes.includes(pet.size)) {
      score += 8;
    } else {
      score -= 12;
    }
  }

  // Age preference
  if (answers.age && answers.age !== "any") {
    const petAgeCategory = pet.age <= 1 ? "baby" : 
                           pet.age <= 3 ? "young" : 
                           pet.age <= 7 ? "adult" : "senior";
    if (answers.age === petAgeCategory) {
      score += 8;
    } else if (Math.abs(["baby", "young", "adult", "senior"].indexOf(answers.age) - 
                        ["baby", "young", "adult", "senior"].indexOf(petAgeCategory)) > 1) {
      score -= 5;
    }
  }

  // Experience matching
  if (answers.experience) {
    if (answers.experience === "first" && pet.temperamentTags.includes("First-Time Owner")) {
      score += 12;
      highlights.push("Great choice for first-time pet owners");
    } else if (answers.experience === "first" && pet.medicalStatus === "Special Needs") {
      score -= 10;
      considerations.push("Special needs pets may be challenging for first-time owners");
    } else if (answers.experience === "experienced") {
      score += 5;
    }
  }

  // Energy preference
  if (answers.energy && answers.energy !== "any") {
    const petEnergy = pet.temperamentTags.includes("High Energy") ? "high" : 
                      pet.temperamentTags.includes("Calm") ? "low" : "medium";
    if (answers.energy === petEnergy) {
      score += 10;
    }
  }

  // Training bonus
  if (pet.temperamentTags.includes("Trained")) {
    score += 5;
    highlights.push("Already trained for easier integration");
  }

  // Playful bonus for active households
  if (pet.temperamentTags.includes("Playful") && 
      (answers.activity === "high" || answers.activity === "very_high" || answers.children !== "no")) {
    score += 5;
    highlights.push("Playful nature will bring joy to your home");
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Generate reasoning based on score
  const templates = score >= 85 ? reasoningTemplates.excellent :
                    score >= 70 ? reasoningTemplates.good :
                    score >= 50 ? reasoningTemplates.moderate :
                    reasoningTemplates.low;
  
  const trait = pet.temperamentTags[0]?.toLowerCase() || "gentle";
  const lifestyle = answers.activity === "high" ? "active lifestyle" :
                    answers.housing === "apartment" ? "apartment living" :
                    "home environment";
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  const reasoning = template
    .replace("{petName}", pet.name)
    .replace("{trait}", trait)
    .replace("{lifestyle}", lifestyle);

  // Ensure at least one highlight and consideration
  if (highlights.length === 0) {
    highlights.push(`${pet.name} has a wonderful ${pet.temperamentTags[0]?.toLowerCase() || "friendly"} personality`);
  }
  if (considerations.length === 0 && score < 90) {
    considerations.push("Allow time for adjustment to new home");
  }

  return {
    compatibility_score: Math.round(score),
    reasoning,
    highlights: highlights.slice(0, 4),
    considerations: considerations.slice(0, 3),
  };
}

// Main matchmaking function - simulates AI API call
export async function getMatchResults(
  answers: QuizAnswers,
  profile: any | null // Use any or AdopterProfile if you've defined the type
): Promise<MatchResult[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Merge profile preferences if they exist (standard Laravel user props)
  const mergedAnswers = { ...answers };
  
  if (profile?.preferences) {
    if (profile.preferences.species?.length > 0) {
      mergedAnswers.species = profile.preferences.species;
    }
  }

  // Calculate compatibility for all pets
  const results: MatchResult[] = mockPets.map(pet => {
    const analysis = calculateCompatibility(pet, mergedAnswers);
    return {
      pet,
      compatibilityScore: analysis.compatibility_score,
      reasoning: analysis.reasoning,
      highlights: analysis.highlights,
      considerations: analysis.considerations,
    };
  });

  // Sort by compatibility score descending
  results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Return top matches (or all if few)
  return results.slice(0, 5);
}

// Get smart recommendations for alternative pets
export async function getSmartRecommendations(
  rejectedPetId: string,
  quizAnswers: QuizAnswers
): Promise<MatchResult[]> {
  await new Promise(resolve => setTimeout(resolve, 800));

  const availablePets = mockPets.filter(p => p.id !== rejectedPetId);
  
  const results: MatchResult[] = availablePets.map(pet => {
    const analysis = calculateCompatibility(pet, quizAnswers);
    return {
      pet,
      compatibilityScore: analysis.compatibility_score,
      reasoning: analysis.reasoning,
      highlights: analysis.highlights,
      considerations: analysis.considerations,
    };
  });

  results.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  return results.slice(0, 3);
}