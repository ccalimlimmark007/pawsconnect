import React, { useState } from "react";
import { Head, router, usePage } from "@inertiajs/react";
import { Navbar } from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { getMatchResults, QuizAnswers } from "@/services/matchmakingService";

// These are the questions from your original project
const steps = [
  {
    id: "species",
    question: "What kind of companion are you looking for?",
    options: [
      { id: "dog", label: "Dogs", icon: "🐕" },
      { id: "cat", label: "Cats", icon: "🐈" },
      { id: "rabbit", label: "Rabbits", icon: "🐇" },
      { id: "any", label: "I'm open to any!", icon: "🐾" },
    ],
    multiple: true,
  },
  {
    id: "housing",
    question: "What's your current living situation?",
    options: [
      { id: "apartment", label: "Apartment/Condo", icon: "🏢" },
      { id: "house_yard", label: "House with Yard", icon: "🏡" },
      { id: "house_no_yard", label: "House (No Yard)", icon: "🏠" },
    ],
  },
  {
    id: "activity",
    question: "How would you describe your activity level?",
    options: [
      { id: "low", label: "Relaxed & Low-key", icon: "🛋️" },
      { id: "moderate", label: "Casual Walks", icon: "🚶" },
      { id: "high", label: "Very Active/Running", icon: "🏃" },
    ],
  },
  // Adding one more important one for the Matchmaker
  {
    id: "experience",
    question: "Your pet ownership experience?",
    options: [
      { id: "first", label: "First-time owner", icon: "🐣" },
      { id: "experienced", label: "Have had pets before", icon: "🦴" },
    ],
  },
];

export default function Quiz() {
  const { props } = usePage();
  const user = (props.auth as any)?.user;
  
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswers>>({});
  const [issubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleOptionSelect = (stepId: string, optionId: string, isMultiple?: boolean) => {
    if (isMultiple) {
      const current = (answers[stepId as keyof QuizAnswers] as string[]) || [];
      const updated = current.includes(optionId)
        ? current.filter((id) => id !== optionId)
        : [...current, optionId];
      setAnswers({ ...answers, [stepId]: updated });
    } else {
      setAnswers({ ...answers, [stepId]: optionId });
      // Auto-advance for single choice after a small delay
      setTimeout(() => {
        if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
      }, 300);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    // Call the service we just fixed!
    const results = await getMatchResults(answers as QuizAnswers, user);
    
    // Redirect to the matches page and pass the results
    router.get('/matches', { results: JSON.stringify(results) });
  };

  return (
    <>
      <Head title="Pet Match Quiz | PawsConnect" />
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 container mx-auto px-4 pt-32 pb-20 max-w-2xl">
          <div className="mb-12">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-primary font-medium mb-1">Step {currentStep + 1} of {steps.length}</p>
                <h2 className="text-2xl font-display">{steps[currentStep].question}</h2>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              className="grid grid-cols-1 gap-4"
            >
              {steps[currentStep].options.map((option) => {
                const isSelected = Array.isArray(answers[steps[currentStep].id as keyof QuizAnswers])
                  ? (answers[steps[currentStep].id as keyof QuizAnswers] as string[]).includes(option.id)
                  : answers[steps[currentStep].id as keyof QuizAnswers] === option.id;

                return (
                  <button
                    key={option.id}
                    onClick={() => handleOptionSelect(steps[currentStep].id, option.id, steps[currentStep].multiple)}
                    className={`flex items-center p-6 rounded-2xl border-2 transition-all text-left ${
                      isSelected 
                        ? "border-primary bg-primary/5 ring-1 ring-primary" 
                        : "border-border hover:border-primary/50 bg-card"
                    }`}
                  >
                    <span className="text-3xl mr-4">{option.icon}</span>
                    <span className="text-lg font-medium">{option.label}</span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>

            {currentStep === steps.length - 1 ? (
              <Button 
                onClick={handleFinish} 
                disabled={issubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {issubmitting ? "Finding Matches..." : "Show My Matches"}
                <Sparkles className="ml-2 w-4 h-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!answers[steps[currentStep].id as keyof QuizAnswers]}
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </main>
      </div>
    </>
  );
}