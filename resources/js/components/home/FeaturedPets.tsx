import { motion } from "framer-motion";
import { mockPets } from "@/data/mockPets";
import { PetCard } from "@/components/pets/PetCard";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import { ArrowRight } from "lucide-react";

export function FeaturedPets() {
  const featuredPets = mockPets.slice(0, 3);

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-4">
            Featured Friends
          </h2>
          <p className="text-lg text-muted-foreground font-body max-w-2xl mx-auto">
            These adorable companions are looking for their forever homes. 
            Could you be their perfect match?
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featuredPets.map((pet, index) => (
            <PetCard key={pet.id} pet={pet} index={index} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-12"
        >
          <Button asChild variant="outline" size="lg">
            <Link href="/pets">
              View All Pets
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}