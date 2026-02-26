import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { ArrowRight, Heart } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="absolute bottom-10 right-20 w-48 h-48 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto space-y-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20">
            <Heart className="w-8 h-8 text-primary-foreground fill-current" />
          </div>

          <h2 className="font-display text-4xl md:text-5xl text-primary-foreground">
            Ready to Find Your Perfect Match?
          </h2>

          <p className="text-lg text-primary-foreground/80 font-body">
            Take our personalized quiz and let our AI help you discover the ideal 
            companion that fits your unique lifestyle.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
              <Link href="/quiz">
                Start the Quiz
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
              <Link href="/pets">
                Browse Pets First
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

