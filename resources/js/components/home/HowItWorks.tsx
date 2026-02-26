import { motion } from "framer-motion";
import { ClipboardList, Brain, Heart, Sparkles } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Take the Quiz",
    description: "Answer questions about your lifestyle, living situation, and pet preferences.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Brain,
    title: "AI Analyzes",
    description: "Our intelligent system matches your profile with available pets.",
    color: "bg-accent/20 text-accent-foreground",
  },
  {
    icon: Sparkles,
    title: "Get Matched",
    description: "Receive personalized recommendations with compatibility scores.",
    color: "bg-secondary text-secondary-foreground",
  },
  {
    icon: Heart,
    title: "Meet & Adopt",
    description: "Connect with shelters and meet your potential new family member.",
    color: "bg-primary/10 text-primary",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            Finding your perfect pet has never been easier. Our AI-powered platform 
            guides you every step of the way.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative"
            >
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
              )}
              
              <div className="text-center space-y-4">
                <div className={`w-24 h-24 mx-auto rounded-2xl ${step.color} flex items-center justify-center shadow-lg`}>
                  <step.icon className="w-10 h-10" />
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-display">
                    {index + 1}
                  </span>
                </div>
                <h3 className="font-display text-xl text-foreground">{step.title}</h3>
                <p className="text-muted-foreground font-body text-sm">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
