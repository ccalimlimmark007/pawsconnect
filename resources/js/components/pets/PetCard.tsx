import { motion } from "framer-motion";
import type { Pet, TemperamentTag } from "@/types/pet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, MapPin } from "lucide-react";
import { Link } from '@inertiajs/react';
import useFavorites from '@/hooks/use-favorites';


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
  return (
    <Link href={`/pets/${pet.id}`} as="div">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="group bg-card rounded-2xl overflow-hidden border border-border card-elevated cursor-pointer"
      >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={pet.imageUrl}
          alt={`${pet.name} - ${pet.breed}`}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
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
            <h3 className="font-display text-xl text-foreground">{pet.name}</h3>
            <p className="text-sm text-muted-foreground font-body">
              {pet.breed} • {pet.age} {pet.ageUnit} old
            </p>
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
          <Button variant="soft" size="sm">
            Meet {pet.name}
          </Button>
        </div>
      </div>
    </motion.article>
    </Link>
  );
}

function FavoriteButton({ petId }: { petId: string }) {
  const { isFavorite, toggle } = useFavorites();

  const fav = isFavorite(petId);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle(petId);
      }}
      aria-pressed={fav}
      className={`absolute top-3 right-3 w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
        fav ? 'bg-primary text-primary-foreground' : 'hover:bg-primary hover:text-primary-foreground'
      }`}
    >
      <Heart className="w-5 h-5" />
    </button>
  );
}