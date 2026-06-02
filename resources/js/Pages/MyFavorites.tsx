import { Head, Link, usePage } from '@inertiajs/react';
import { Heart, MapPin, PawPrint } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import useFavorites from '@/hooks/use-favorites';
import type { BreadcrumbItem } from '@/types';

type FavoritePet = {
    id: string;
    name: string;
    species: string;
    breed: string;
    age: number;
    ageUnit: string;
    imageUrl: string | null;
    adoptionFee: number;
    shelterName: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile', href: '/profile' },
    { title: 'My Favorites', href: '/my-favorites' },
];

export default function MyFavorites() {
    const { favoritePets: rawPets } = usePage().props as { favoritePets?: FavoritePet[] };
    const { toggle } = useFavorites();

    const [pets, setPets] = useState<FavoritePet[]>(Array.isArray(rawPets) ? rawPets : []);

    const handleRemove = (pet: FavoritePet) => {
        setPets(prev => prev.filter(p => p.id !== pet.id));
        void toggle(pet.id, pet.name);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Favorites" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">

                    {/* Page header */}
                    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-4xl font-serif">My Favorites</h1>
                            <p className="mt-2 text-muted-foreground">
                                {pets.length > 0
                                    ? `${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} saved`
                                    : 'No favorites saved yet'}
                            </p>
                        </div>
                        <Link href="/pets">
                            <Button variant="outline" className="gap-2">
                                <PawPrint className="h-4 w-4" />
                                Browse More Pets
                            </Button>
                        </Link>
                    </div>

                    {/* Empty state */}
                    {pets.length === 0 ? (
                        <div className="flex flex-col items-center rounded-xl border border-dashed border-border py-24 text-center">
                            <Heart className="mb-4 h-12 w-12 text-muted-foreground" />
                            <h3 className="mb-2 text-xl font-semibold">No favorites yet</h3>
                            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                                Tap the heart icon on any pet to save them here.
                            </p>
                            <Link href="/pets">
                                <Button className="gap-2">
                                    <PawPrint className="h-4 w-4" />
                                    Browse Pets
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        /* Full grid */
                        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                            {pets.map(pet => (
                                <div
                                    key={pet.id}
                                    className="group relative overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
                                >
                                    <Link href={`/pets/${pet.id}`} className="block">
                                        <div className="aspect-square overflow-hidden bg-secondary">
                                            {pet.imageUrl ? (
                                                <img
                                                    src={pet.imageUrl}
                                                    alt={pet.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center">
                                                    <PawPrint className="h-12 w-12 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-3">
                                            <p className="truncate font-semibold">{pet.name}</p>
                                            <p className="truncate text-xs capitalize text-muted-foreground">
                                                {pet.species} · {pet.breed}
                                            </p>
                                            <div className="mt-2 flex items-center justify-between gap-2">
                                                <span className="text-sm font-medium text-primary">
                                                    {pet.adoptionFee > 0
                                                        ? `₱${pet.adoptionFee.toLocaleString()}`
                                                        : 'Free'}
                                                </span>
                                                {pet.shelterName && (
                                                    <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                                                        <MapPin className="h-3 w-3 shrink-0" />
                                                        <span className="truncate">{pet.shelterName}</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>

                                    {/* Remove button — appears on hover */}
                                    <button
                                        onClick={() => handleRemove(pet)}
                                        aria-label={`Remove ${pet.name} from favorites`}
                                        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 text-rose-500 opacity-0 backdrop-blur-sm transition-all hover:scale-110 hover:bg-rose-50 group-hover:opacity-100 dark:hover:bg-rose-950"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            viewBox="0 0 24 24"
                                            className="h-4 w-4 fill-current"
                                        >
                                            <path d="M12 21s-7.5-4.9-10-8.2A5.5 5.5 0 0 1 3 7.5C3 5 5 3 7.5 3c1.6 0 3 .9 4.5 2.4C13.5 3.9 14.9 3 16.5 3 19 3 21 5 21 7.5c0 1.9-.7 3.5-1.9 5.3C19.5 16.1 12 21 12 21z" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
