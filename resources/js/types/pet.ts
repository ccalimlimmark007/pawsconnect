export type TemperamentTag = 
  | "High Energy"
  | "Calm"
  | "Good with Kids"
  | "Good with Pets"
  | "Playful"
  | "Trained"
  | "Senior Friendly"
  | "First-Time Owner";

export type Species = "Dog" | "Cat" | "Rabbit" | "Bird" | "Other";

export type MedicalStatus = "Healthy" | "Under Treatment" | "Special Needs";

export interface Pet {
  id: string;
  name: string;
  species: Species;
  breed: string;
  age: number;
  ageUnit: "months" | "years";
  gender: "Male" | "Female";
  size: "Small" | "Medium" | "Large";
  temperamentTags: TemperamentTag[];
  medicalStatus: MedicalStatus;
  description: string;
  imageUrl: string;
  shelterName: string;
  adoptionFee: number;
  dateAdded: string;
}

export interface Adopter {
  id: string;
  name: string;
  email: string;
  housingType: "House with Yard" | "House without Yard" | "Apartment" | "Condo";
  hasChildren: boolean;
  childrenAges?: string;
  existingPets: string[];
  activityLevel: "Low" | "Moderate" | "High" | "Very High";
  workSchedule: "Work from Home" | "Part-Time Away" | "Full-Time Away";
  experience: "First-Time" | "Some Experience" | "Experienced";
  preferences: {
    species: Species[];
    sizePreference: ("Small" | "Medium" | "Large")[];
    energyPreference: "Low" | "Medium" | "High" | "Any";
    agePreference: "Puppy/Kitten" | "Young Adult" | "Adult" | "Senior" | "Any";
  };
}

export interface MatchResult {
  pet: Pet;
  compatibilityScore: number;
  reasoning: string;
  highlights: string[];
  considerations: string[];
}

export interface QuizStep {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multiple" | "text";
  options?: { value: string; label: string; icon?: string }[];
  required: boolean;
}