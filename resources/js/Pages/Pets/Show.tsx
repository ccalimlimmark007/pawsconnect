import { Head, Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, FileText, Phone, Mail, MapPin, Heart } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useFavorites from '@/hooks/use-favorites';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { mockPets } from '@/data/mockPets';

export default function Show() {
    const props = usePage().props as any;
    // If server provided pet prop use it, otherwise rely on mock data via URL
    const route = (props as any).route || '';
    // attempt to extract id from url present in props
    const url = typeof window !== 'undefined' ? window.location.pathname : '';
    const id = url.split('/').pop() || '';

    const pet = mockPets.find((p) => p.id === id) || mockPets[0];

    const images = [pet.imageUrl, pet.imageUrl + '&ixlib=rb-1.2.1&q=80', pet.imageUrl + '&crop=entropy&w=800'];
    const [current, setCurrent] = useState(0);

    return (
        <AppLayout>
            <Head title={`${pet.name} — Pet`} />

            <div className="container mx-auto px-4 py-10">
                <div className="mb-6 flex items-center justify-between">
                    <Link href="/pets" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back to all pets
                    </Link>

                    <FavoriteDialog pet={pet} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="rounded-xl border bg-card p-6">
                            <div className="relative">
                                <img src={images[current]} alt={pet.name} className="w-full rounded-lg object-cover h-96" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow"
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(images.length - 1, c + 1)); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 shadow"
                                >
                                    <ChevronRight />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-4">
                                {images.map((src, i) => (
                                    <button key={i} onClick={() => setCurrent(i)} className={`w-20 h-14 overflow-hidden rounded-lg ${i===current? 'ring-2 ring-primary' : ''}`}>
                                        <img src={src} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6">
                                <h1 className="text-3xl font-semibold">{pet.name}</h1>
                                <p className="text-muted-foreground">{pet.breed} • {pet.age} {pet.ageUnit} • {pet.gender} • {pet.size}</p>

                                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-lg border p-4"> 
                                        <h4 className="font-medium mb-2">Diet</h4>
                                        <p className="text-sm text-muted-foreground">Currently on standard kibble, 2 cups twice daily. No known allergies.</p>
                                    </div>
                                    <div className="rounded-lg border p-4"> 
                                        <h4 className="font-medium mb-2">Exercise</h4>
                                        <p className="text-sm text-muted-foreground">Needs 30–60 minutes of activity per day. Loves walks and fetch.</p>
                                    </div>
                                </div>

                                <div className="mt-6">
                                    <h3 className="text-lg font-semibold mb-3">Medical History</h3>
                                    <ul className="space-y-3">
                                        <li className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Rabies vaccine</p>
                                                    <p className="text-sm text-muted-foreground">Vaccination — Dr. Sarah Chen</p>
                                                </div>
                                                <div className="text-sm text-muted-foreground">Jan 10, 2024</div>
                                            </div>
                                        </li>
                                        <li className="rounded-lg border p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">Annual wellness exam</p>
                                                    <p className="text-sm text-muted-foreground">Checkup — Dr. Sarah Chen</p>
                                                </div>
                                                <div className="text-sm text-muted-foreground">Nov 20, 2023</div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <aside className="space-y-4">
                        <div className="rounded-xl border bg-card p-6">
                            <h4 className="font-medium mb-2">Compatibility</h4>
                            <p className="text-sm text-muted-foreground">Good with children, other dogs with slow introduction. May not be suitable for small rodents.</p>
                        </div>

                        <div className="rounded-xl border bg-card p-6">
                            <h4 className="font-medium mb-2">Shelter Contact</h4>
                            <p className="text-sm text-muted-foreground mb-3">{pet.shelterName}</p>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <div className="flex items-center gap-2"><Phone className="w-4 h-4" /> <span>(555) 234-5678</span></div>
                                <div className="flex items-center gap-2"><Mail className="w-4 h-4" /> <span>adopt@happypaws.org</span></div>
                                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> <span>1234 Pawprint Lane, Portland, OR 97201</span></div>
                                <div className="text-xs text-muted-foreground">Mon–Sat 10am–6pm, Sun 12pm–5pm</div>
                            </div>

                            <div className="mt-4 grid gap-2">
                                <Button variant="outline">Application Pending</Button>
                                <Button>Schedule a Visit</Button>
                            </div>
                        </div>

                        <div className="rounded-xl border bg-card p-6">
                            <h4 className="font-medium mb-2">Adoption</h4>
                            <div className="text-2xl font-semibold text-primary">${pet.adoptionFee}</div>
                            <Button className="mt-4 w-full">Apply to Adopt</Button>
                        </div>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}

function FavoriteDialog({ pet }: { pet: any }) {
    const { isFavorite, toggle, remove } = useFavorites();
    const fav = isFavorite(pet.id);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    onClick={(e) => {
                        // toggle favorite then open dialog
                        toggle(pet.id);
                    }}
                    className="rounded-full bg-background/80 p-3 shadow hover:bg-red-50">
                    <Heart className="w-5 h-5" />
                </button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
                <DialogTitle>{fav ? 'Saved to favorites' : 'Added to favorites'}</DialogTitle>
                <DialogDescription>
                    <div className="flex gap-4 mt-4">
                        <img src={pet.imageUrl} alt={pet.name} className="w-20 h-20 object-cover rounded-lg" />
                        <div>
                            <div className="font-semibold">{pet.name}</div>
                            <div className="text-sm text-muted-foreground">{pet.breed}</div>
                            <div className="text-sm text-muted-foreground mt-2">Shelter: {pet.shelterName}</div>
                            <div className="text-sm text-muted-foreground mt-2">Fee: ${pet.adoptionFee}</div>

                            <div className="mt-4 flex gap-2">
                                <Link href={`/apply?pet=${pet.id}`} className="inline-block">
                                    <Button>Apply to Adopt</Button>
                                </Link>
                                <Button variant="outline" onClick={() => remove(pet.id)}>Remove</Button>
                            </div>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
