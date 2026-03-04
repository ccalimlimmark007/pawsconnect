import { Link } from '@inertiajs/react';
import { motion } from "framer-motion";
import { Heart, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import useFavorites from '@/hooks/use-favorites';
import type { Pet, TemperamentTag } from "@/types/pet";


interface PetCardProps {
  pet: Pet;
  index?: number;
}

const tagVariants: Record<TemperamentTag, "energy" | "calm" | "friendly" | "playful" | "trained"> = {
  "High Energy": "energy",
  "Calm": "calm",
  "Good with Kids": "friendly",
  "Good with Pets": "friendly",
  "Playful": "playful",
  "Trained": "trained",
  "Senior Friendly": "calm",
  "First-Time Owner": "trained",
};

export function PetCard({ pet, index = 0 }: PetCardProps) {
  const { toggle, isFavorite } = useFavorites();

  return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group bg-card rounded-2xl overflow-hidden border border-border card-elevated cursor-pointer"
      >
      <div className="relative aspect-4/3 overflow-hidden">
        <Link href={`/pets/${pet.id}`} className="block">
          <img
            src={pet.imageUrl}
            alt={`${pet.name} - ${pet.breed}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/** favorite button — stopPropagation so link doesn't navigate */}
        <FavoriteButton petId={pet.id} />

        {pet.medicalStatus !== "Healthy" && (
          <Badge variant="secondary" className="absolute top-3 left-3">
            {pet.medicalStatus}
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <Link href={`/pets/${pet.id}`} className="block">
              <h3 className="font-display text-xl text-foreground">{pet.name}</h3>
              <p className="text-sm text-muted-foreground font-body">
                {pet.breed} • {pet.age} {pet.ageUnit} old
              </p>
            </Link>
          </div>
          <div className="text-right">
            <span className="font-display text-lg text-primary">${pet.adoptionFee}</span>
            <p className="text-xs text-muted-foreground">Adoption Fee</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {pet.temperamentTags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant={tagVariants[tag]} className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground font-body line-clamp-2">
          {pet.description}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-body">{pet.shelterName}</span>
          </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  toggle(pet.id);
                }}
                aria-label="Toggle favorite"
                className={`inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-muted/30 ${isFavorite(pet.id) ? 'text-primary' : ''}`}
              >
                {isFavorite(pet.id) ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M12 21s-7.5-4.9-10-8.2A5.5 5.5 0 0 1 3 7.5C3 5 5 3 7.5 3c1.6 0 3 .9 4.5 2.4C13.5 3.9 14.9 3 16.5 3 19 3 21 5 21 7.5c0 1.9-.7 3.5-1.9 5.3C19.5 16.1 12 21 12 21z" />
                  </svg>
                ) : (
                  <Heart className="w-4 h-4" />
                )}
              </button>

              <Link href={`/pets/${pet.id}`}>
                <Button variant="soft" size="sm">
                  Meet {pet.name}
                </Button>
              </Link>
            </div>
        </div>
      </div>

      {/* Details moved to the pet detail page. */}
    </motion.article>
  );
}

function FavoriteButton({ petId }: { petId: string }) {
  // Clicking the heart navigates to the pet detail page per design
  return (
    <Link
      href={`/pets/${petId}`}
      className="absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 hover:bg-primary hover:text-primary-foreground"
      aria-label="View pet details"
    >
      <Heart className="w-5 h-5" />
    </Link>
  );
}