import { motion } from "framer-motion";
import { Link } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
const heroPets = "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600";

export function HeroSection() {
  return (
    <section className="relative min-h-screen hero-section flex items-center pt-16 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-accent/15 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-secondary/20 blur-2xl animate-float" style={{ animationDelay: "4s" }} />
      </div>

      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-body text-foreground">AI-Powered Pet Matching</span>
            </div>

            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight text-balance">
              Find Your{" "}
              <span className="text-primary">Perfect</span>{" "}
              Companion
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-body leading-relaxed">
              Our intelligent matchmaking connects you with shelter pets that fit your lifestyle. 
              Take our quiz and discover your ideal furry friend today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="hero" size="lg">
                <Link href="/quiz">
                  Take the Quiz
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="heroOutline" size="lg">
                <Link href="/pets">
                  Browse All Pets
                </Link>
              </Button>
            </div>

            <div className="flex items-center gap-8 pt-4">
              <div>
                <p className="text-3xl font-display text-foreground">2,500+</p>
                <p className="text-sm text-muted-foreground font-body">Pets Adopted</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-display text-foreground">150+</p>
                <p className="text-sm text-muted-foreground font-body">Partner Shelters</p>
              </div>
              <div className="w-px h-12 bg-border" />
              <div>
                <p className="text-3xl font-display text-foreground">98%</p>
                <p className="text-sm text-muted-foreground font-body">Match Success</p>
              </div>
            </div>
          </motion.div>

          {/* Right: Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1552053831-71594a27632d?w=600"
                alt="Adorable dog and cat waiting for adoption"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-card rounded-2xl p-4 shadow-card border border-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-2xl">🐾</span>
                </div>
                <div>
                  <p className="font-display text-foreground">Perfect Match Found!</p>
                  <p className="text-sm text-muted-foreground font-body">95% Compatibility</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}