import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Phone, Mail, MapPin, Heart, Stethoscope, Syringe, Activity, Sparkles, Check, AlertCircle, Utensils, Dumbbell, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { mockPets } from '@/data/mockPets';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import useFavorites from '@/hooks/use-favorites';

export default function Show({ petId }: { petId: string }) {
    const pet = mockPets.find((p) => p.id === petId);

    if (!pet) {
        return (
            <AppLayout>
                <Head title="Pet Not Found" />
                <div className="container mx-auto px-4 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold mb-4">Pet not found</h1>
                        <Link href="/pets">
                            <Button>Back to Pets</Button>
                        </Link>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const images = [pet.imageUrl, pet.imageUrl + '&ixlib=rb-1.2.1&q=80', pet.imageUrl + '&crop=entropy&w=800'];
    const [current, setCurrent] = useState(0);

    const tagVariants: Record<any, { color: string; bgColor: string }> = {
        "High Energy": { color: "text-orange-700", bgColor: "bg-orange-100" },
        "Calm": { color: "text-purple-700", bgColor: "bg-purple-100" },
        "Good with Kids": { color: "text-green-700", bgColor: "bg-green-100" },
        "Good with Pets": { color: "text-green-700", bgColor: "bg-green-100" },
        "Playful": { color: "text-orange-700", bgColor: "bg-orange-100" },
        "Trained": { color: "text-purple-700", bgColor: "bg-purple-100" },
        "Senior Friendly": { color: "text-purple-700", bgColor: "bg-purple-100" },
        "First-Time Owner": { color: "text-green-700", bgColor: "bg-green-100" },
    };

    const pickMedicalIcon = (title: string) => {
        const t = title?.toLowerCase() || '';
        if (t.includes('vaccine') || t.includes('vaccin')) return <Syringe className="w-4 h-4 text-blue-600" />;
        if (t.includes('surgery')) return <Activity className="w-4 h-4 text-red-600" />;
        if (t.includes('exam') || t.includes('wellness') || t.includes('check')) return <Stethoscope className="w-4 h-4 text-green-600" />;
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    };

    return (
            <AppLayout>
                <Head title={`${pet.name} — Pet`} />

                <div className="container mx-auto px-4 py-12">
                    <div className="mb-6">
                        <Link href="/pets" className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                            <ArrowLeft className="w-4 h-4" /> Back to all pets
                        </Link>
                    </div>

                    {/* SHELTER CONTACT (right column) will appear above CTA */}
                    {/* Insert shelter contact card in the right column area (below lists, above CTA) */}
                    {/* We'll render a full-width medical history section after the main container below. */}

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* LEFT: gallery */}
                        <div className="lg:col-span-7">
                            <div className="relative rounded-2xl overflow-hidden border bg-card">
                                <img src={images[current]} alt={pet.name} className="w-full h-96 object-cover object-center" />

                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                                >
                                    <ChevronLeft />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(images.length - 1, c + 1)); }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                                >
                                    <ChevronRight />
                                </button>
                            </div>

                            <div className="flex gap-3 mt-4">
                                {images.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        className={`w-20 h-14 rounded-lg overflow-hidden border ${i === current ? 'ring-2 ring-primary' : 'bg-white'}`}>
                                        <img src={src} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: details + actions */}
                        <div className="lg:col-span-5">
                            <div className="relative">
                                <FavoriteDialog pet={pet} />
                            </div>

                            <h1 className="text-4xl font-display mb-2">{pet.name}</h1>
                            <p className="text-muted-foreground mb-4">{pet.breed} • {pet.gender} • {pet.age} {pet.ageUnit} • {pet.size}</p>

                            <div className="flex flex-wrap gap-2 mb-6">
                                {pet.temperamentTags.map((t) => {
                                    const variant = tagVariants[t] || { color: "text-gray-700", bgColor: "bg-gray-100" };
                                    return (
                                        <span key={t} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${variant.bgColor} ${variant.color}`}>
                                            {t}
                                        </span>
                                    );
                                })}
                            </div>

                            <p className="text-muted-foreground mb-6 leading-relaxed">{pet.description}</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2"><Utensils className="w-4 h-4 text-orange-600" /> Diet</h4>
                                    <p className="text-sm text-muted-foreground">Currently on premium grain-free kibble, 2 cups twice daily. No known food allergies.</p>
                                </div>
                                <div className="rounded-lg border bg-card p-4">
                                    <h4 className="font-medium mb-2 flex items-center gap-2"><Dumbbell className="w-4 h-4 text-blue-600" /> Exercise</h4>
                                    <p className="text-sm text-muted-foreground">Needs 60–90 minutes of active exercise daily. Loves swimming, hiking, and fetch.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h5 className="font-medium mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Good With</h5>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>Children of all ages</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>Other dogs</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                                            <span>Cats (with slow introduction)</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h5 className="font-medium mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Considerations</h5>
                                    <ul className="space-y-2 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <span>Small rodents</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                            <span>Being left alone for 8+ hours</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="mt-6 rounded-xl border bg-linear-to-r from-orange-50 to-orange-50/50 dark:from-orange-950/20 dark:to-orange-950/10 p-6 flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-3xl font-bold text-orange-600">${pet.adoptionFee}</div>
                                    <div className="text-sm text-muted-foreground">Adoption Fee</div>
                                </div>

                                <div className="flex-1">
                                    <Link href={`/apply?pet=${pet.id}`} className="inline-block w-full">
                                        <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Apply to Adopt {pet.name}</Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Removed shelter contact from here - will be beside medical history below */}
                        </div>
                    </div>

                    {/* Medical History and Shelter Contact side by side */}
                    <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-8">
                        {/* Medical History */}
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <Stethoscope className="w-4 h-4 text-primary" />
                                        </div>
                                        Medical History
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {pet.medicalHistory && pet.medicalHistory.length > 0 ? (
                                            pet.medicalHistory.map((record: any, i: number) => (
                                                <div key={i}>
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">{pickMedicalIcon(record.title)}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <p className="font-semibold text-foreground">{record.title}</p>
                                                                <span className="text-xs text-muted-foreground shrink-0 ml-4">{record.date}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground">{record.note}</p>
                                                        </div>
                                                    </div>
                                                    {i < pet.medicalHistory.length - 1 && <Separator className="mt-4" />}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-sm text-muted-foreground">No medical records available.</div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Shelter Contact */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-3 text-xl">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                            <MapPin className="w-4 h-4 text-primary" />
                                        </div>
                                        Shelter Contact
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="font-semibold text-foreground text-lg">{pet.shelterName}</div>
                                        <div className="flex items-center gap-3">
                                            <Phone className="w-4 h-4 text-muted-foreground shrink-0" /> 
                                            <span className="text-sm text-foreground">{pet.shelterContact?.phone ?? '(555) 234-5678'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" /> 
                                            <span className="text-sm text-foreground">{pet.shelterContact?.email ?? 'adopt@happypaws.org'}</span>
                                        </div>
                                        <div>
                                            <div className="flex items-start gap-3">
                                                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                                <div className="text-sm text-foreground">{pet.shelterContact?.address ?? '1234 Pawprint Lane, Portland, OR 97201'}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground border-t pt-4">{pet.shelterContact?.hours ?? 'Mon–Sat 10am–6pm, Sun 12pm–5pm'}</div>

                                        <div className="mt-4 grid gap-2 pt-2">
                                            <Link href={`/apply?pet=${pet.id}`} className="inline-block">
                                                <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">Apply to Adopt {pet.name}</Button>
                                            </Link>
                                            <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-50">Schedule a Visit</Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
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
                    className={`rounded-full p-3 shadow ${fav ? 'bg-red-50' : 'bg-background/80'} hover:bg-red-50`}>
                    <Heart className={`w-5 h-5 ${fav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
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
