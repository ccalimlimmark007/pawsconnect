import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    Activity, AlertCircle, AlertTriangle, ArrowDown, ArrowLeft, ArrowUp,
    CalendarDays, Check, CheckCircle, CheckCircle2, ChevronLeft, ChevronRight,
    Dumbbell, Heart, ImageIcon, Mail, MapPin, Phone, Sparkles, Star,
    Stethoscope, Syringe, Trash2, Upload, Utensils,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { mockPets } from '@/data/mockPets';
import useFavorites from '@/hooks/use-favorites';
import type { Pet, PetImage, TemperamentTag } from '@/types/pet';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ExistingVisit {
    id: number;
    visit_date: string;   // YYYY-MM-DD
    visit_time: string;   // HH:MM or HH:MM:SS
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

interface AvailabilityResponse {
    available: string[];
    slot_duration_minutes: number;
    closed: boolean;
    message: string | null;
}

interface BookedDatesResponse {
    booked_dates: string[];
    closed_days: string[];   // e.g. ['saturday', 'sunday']
}

interface SharedProps {
    auth: { user: { id: number; name: string } | null };
    flash: { status: string | null; success: string | null };
    [key: string]: unknown;
}

interface ShowProps {
    petId: string;
    pet?: Pet;
    canManageImages?: boolean;
    existingVisit?: ExistingVisit | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a local YYYY-MM-DD string without UTC offset shifting. */
function localDateStr(d = new Date()): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Convert HH:MM to "9:00 AM" */
function fmtTime(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/** Format a YYYY-MM-DD as "Wednesday, June 10, 2026" using local time. */
function fmtDate(iso: string): string {
    const [y, mo, d] = iso.split('-').map(Number);
    return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
}

/**
 * Build a compact range label: "8:00 – 9:00 AM"
 * The AM/PM suffix is only shown once, on the end time.
 */
function fmtSlotRange(startHhmm: string, durationMinutes: number): string {
    const [h, m]    = startHhmm.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins   = startMins + durationMinutes;
    const endH      = Math.floor(endMins / 60) % 24;
    const endM      = endMins % 60;
    const endHhmm   = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    const fmtHalf = (hhmm: string) => {
        const [hh, mm] = hhmm.split(':').map(Number);
        return `${hh % 12 || 12}:${String(mm).padStart(2, '0')}`;
    };
    const endAmPm = endH >= 12 ? 'PM' : 'AM';
    return `${fmtHalf(startHhmm)} – ${fmtHalf(endHhmm)} ${endAmPm}`;
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function Show({ petId, pet: serverPet, canManageImages = false, existingVisit = null }: ShowProps) {
    const { flash } = usePage<SharedProps>().props;
    const [current, setCurrent] = useState(0);
    const pet = serverPet ?? mockPets.find((p) => String(p.id) === String(petId));

    if (!pet) {
        return (
            <AppLayout>
                <Head title="Pet Not Found" />
                <div className="content-wrapper py-12 text-center">
                    <h1 className="text-2xl font-bold mb-4">Pet not found</h1>
                    <Link href="/pets"><Button>Back to Pets</Button></Link>
                </div>
            </AppLayout>
        );
    }

    const sortedImages: string[] =
        pet.images && pet.images.length > 0
            ? [...pet.images].sort((a, b) => a.order - b.order).map((img) => img.url)
            : pet.imageUrl ? [pet.imageUrl] : [];

    const safeIndex = Math.min(current, Math.max(sortedImages.length - 1, 0));

    const tagVariants: Record<TemperamentTag, { color: string; bgColor: string }> = {
        'High Energy':       { color: 'text-orange-700', bgColor: 'bg-orange-100' },
        'Calm':              { color: 'text-purple-700', bgColor: 'bg-purple-100' },
        'Good with Kids':    { color: 'text-green-700',  bgColor: 'bg-green-100'  },
        'Good with Pets':    { color: 'text-green-700',  bgColor: 'bg-green-100'  },
        'Playful':           { color: 'text-orange-700', bgColor: 'bg-orange-100' },
        'Trained':           { color: 'text-purple-700', bgColor: 'bg-purple-100' },
        'Senior Friendly':   { color: 'text-purple-700', bgColor: 'bg-purple-100' },
        'First-Time Owner':  { color: 'text-green-700',  bgColor: 'bg-green-100'  },
    };

    const pickMedicalIcon = (title: string) => {
        const t = title?.toLowerCase() || '';
        if (t.includes('vaccine') || t.includes('vaccination')) return <Syringe className="w-4 h-4 text-blue-600" />;
        if (t.includes('surgery'))                               return <Activity className="w-4 h-4 text-red-600" />;
        if (t.includes('exam') || t.includes('wellness') || t.includes('check')) return <Stethoscope className="w-4 h-4 text-green-600" />;
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    };

    return (
        <AppLayout>
            <Head title={`${pet.name} — Pet`} />

            <div className="content-wrapper py-12">

                {/* ── Flash ─────────────────────────────────────────────── */}
                {flash?.success && (
                    <Alert className="mb-6 border-green-200 bg-green-50 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200">
                        <CheckCircle className="size-4 text-green-600 dark:text-green-400" />
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                <div className="mb-6">
                    <Link href="/pets" className="inline-flex items-center gap-3 text-sm text-muted-foreground">
                        <ArrowLeft className="w-4 h-4" /> Back to all pets
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* ── Gallery ───────────────────────────────────────── */}
                    <div className="lg:col-span-7">
                        <div className="relative rounded-2xl overflow-hidden border bg-card">
                            {sortedImages.length > 0 ? (
                                <img src={sortedImages[safeIndex]} alt={pet.name} className="w-full h-96 object-cover object-center" />
                            ) : (
                                <div className="w-full h-96 flex items-center justify-center bg-muted">
                                    <ImageIcon className="w-16 h-16 text-muted-foreground/40" />
                                </div>
                            )}
                            {sortedImages.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.max(0, c - 1)); }}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                                    >
                                        <ChevronLeft />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setCurrent((c) => Math.min(sortedImages.length - 1, c + 1)); }}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow"
                                    >
                                        <ChevronRight />
                                    </button>
                                </>
                            )}
                        </div>
                        {sortedImages.length > 1 && (
                            <div className="flex gap-3 mt-4 flex-wrap">
                                {sortedImages.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrent(i)}
                                        className={`w-20 h-14 rounded-lg overflow-hidden border ${i === safeIndex ? 'ring-2 ring-primary' : 'bg-white'}`}
                                    >
                                        <img src={src} className="w-full h-full object-cover" alt="" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Pet details ───────────────────────────────────── */}
                    <div className="lg:col-span-5">
                        <div className="relative"><FavoriteDialog pet={pet} /></div>

                        <h1 className="text-4xl font-display mb-2">{pet.name}</h1>
                        <p className="text-muted-foreground mb-4">
                            {pet.breed} • {pet.gender} • {pet.age} {pet.ageUnit} • {pet.size}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-6">
                            {pet.temperamentTags.map((t) => {
                                const v = tagVariants[t] || { color: 'text-gray-700', bgColor: 'bg-gray-100' };
                                return (
                                    <span key={t} className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${v.bgColor} ${v.color}`}>
                                        {t}
                                    </span>
                                );
                            })}
                        </div>

                        <p className="text-muted-foreground mb-6 leading-relaxed">{pet.description}</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="rounded-lg border bg-card p-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Utensils className="w-4 h-4 text-orange-600" /> Diet
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Currently on premium grain-free kibble, 2 cups twice daily. No known food allergies.
                                </p>
                            </div>
                            <div className="rounded-lg border bg-card p-4">
                                <h4 className="font-medium mb-2 flex items-center gap-2">
                                    <Dumbbell className="w-4 h-4 text-blue-600" /> Exercise
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Needs 60–90 minutes of active exercise daily. Loves swimming, hiking, and fetch.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div>
                                <h5 className="font-medium mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" /> Good With
                                </h5>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>Children of all ages</span></li>
                                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>Other dogs</span></li>
                                    <li className="flex items-start gap-2"><Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" /><span>Cats (with slow introduction)</span></li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-medium mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-amber-500" /> Considerations
                                </h5>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span>Small rodents</span></li>
                                    <li className="flex items-start gap-2"><AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" /><span>Being left alone for 8+ hours</span></li>
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
                                    <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                        Apply to Adopt {pet.name}
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Image manager (staff/admin) ─────────────────────── */}
                {canManageImages && pet.images !== undefined && (
                    <ImageManager petId={pet.id} images={pet.images} />
                )}

                {/* ── Medical history + Shelter contact ──────────────── */}
                <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                                    {(() => {
                                        const records = pet.medicalHistory ?? [];
                                        if (records.length === 0) {
                                            return <p className="text-sm text-muted-foreground">No medical records available.</p>;
                                        }
                                        return records.map((rec, i) => (
                                            <div key={i}>
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                                                        {pickMedicalIcon(rec.title)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <p className="font-semibold text-foreground">{rec.title}</p>
                                                            <span className="text-xs text-muted-foreground shrink-0 ml-4">{rec.date}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">{rec.note}</p>
                                                    </div>
                                                </div>
                                                {i < records.length - 1 && <Separator className="mt-4" />}
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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
                                        <span className="text-sm">{pet.shelterContact?.phone ?? '(555) 234-5678'}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <span className="text-sm">{pet.shelterContact?.email ?? 'adopt@happypaws.org'}</span>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="text-sm">{pet.shelterContact?.address ?? '1234 Pawprint Lane, Portland, OR 97201'}</div>
                                    </div>
                                    <div className="text-xs text-muted-foreground border-t pt-4">
                                        {pet.shelterContact?.hours ?? 'Mon–Sat 10am–6pm, Sun 12pm–5pm'}
                                    </div>

                                    <div className="mt-4 grid gap-2 pt-2">
                                        <Link href={`/apply?pet=${pet.id}`} className="inline-block">
                                            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white">
                                                Apply to Adopt {pet.name}
                                            </Button>
                                        </Link>
                                        <ScheduleVisitDialog pet={pet} existingVisit={existingVisit} />
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

// ---------------------------------------------------------------------------
// ScheduleVisitDialog — orchestrates the full booking flow
// ---------------------------------------------------------------------------

interface ScheduleVisitDialogProps {
    pet: Pet;
    existingVisit: ExistingVisit | null | undefined;
}

function ScheduleVisitDialog({ pet, existingVisit }: ScheduleVisitDialogProps) {
    const { auth } = usePage<SharedProps>().props;
    const isAuth   = !!auth?.user;

    const [open, setOpen]               = useState(false);
    const [date, setDate]               = useState('');
    const [time, setTime]               = useState('');
    const [message, setMessage]         = useState('');
    const [slots, setSlots]             = useState<string[]>([]);
    const [slotDuration, setSlotDuration] = useState(60);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [slotMeta, setSlotMeta]       = useState<{ closed: boolean; message: string | null } | null>(null);
    const [submitting, setSubmitting]   = useState(false);
    const [errors, setErrors]           = useState<Record<string, string>>({});

    // Reset inner state whenever dialog opens/closes
    const handleOpenChange = (v: boolean) => {
        setOpen(v);
        if (!v) {
            setDate(''); setTime(''); setMessage('');
            setSlots([]); setSlotDuration(60); setSlotMeta(null);
            setErrors({});
        }
    };

    const slotsRef = useRef<HTMLElement>(null);

    const fetchSlots = async (selectedDate: string) => {
        setTime('');
        setSlots([]);
        setSlotMeta(null);
        setLoadingSlots(true);
        try {
            const res = await fetch(
                `/api/shelter-visits/available-slots?pet_id=${pet.id}&date=${selectedDate}`
            );

            if (!res.ok) {
                const err = await res.json().catch(() => ({})) as Record<string, unknown>;
                const msg = typeof err.message === 'string' ? err.message : 'Could not load slots. Please try again.';
                setSlotMeta({ closed: false, message: msg });
                return;
            }

            const data = (await res.json()) as AvailabilityResponse;
            setSlots(data.available ?? []);
            setSlotDuration(data.slot_duration_minutes ?? 60);
            setSlotMeta({ closed: data.closed, message: data.message });

            // Scroll the time-slot section into view after a short paint delay
            setTimeout(() => {
                slotsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 80);
        } catch {
            setSlotMeta({ closed: false, message: 'Could not load slots. Please try again.' });
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDateSelect = (selectedDate: string) => {
        setDate(selectedDate);
        setErrors((e) => ({ ...e, visit_date: '', visit_time: '' }));
        void fetchSlots(selectedDate);
    };

    const handleTimeSelect = (slot: string) => {
        setTime(slot);
        setErrors((e) => ({ ...e, visit_time: '' }));
    };

    const validate = (): boolean => {
        const errs: Record<string, string> = {};
        if (!date) errs.visit_date = 'Please select a visit date.';
        if (!time) errs.visit_time = 'Please select a time slot.';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        setSubmitting(true);
        router.post(
            '/visits',
            { pet_id: pet.id, visit_date: date, visit_time: time, message: message || null },
            {
                onError:   (serverErrors) => setErrors(serverErrors as Record<string, string>),
                onFinish:  () => setSubmitting(false),
                onSuccess: () => handleOpenChange(false),
            },
        );
    };

    // ── Not logged in ────────────────────────────────────────────────────────
    if (!isAuth) {
        return (
            <Link href="/login">
                <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-50">
                    Schedule a Visit
                </Button>
            </Link>
        );
    }

    // ── Already has an active visit ──────────────────────────────────────────
    if (existingVisit) {
        return (
            <div className="rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800 p-3">
                <div className="flex items-start gap-2">
                    <CalendarDays className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium text-orange-800 dark:text-orange-200">
                            Visit on {fmtDate(existingVisit.visit_date)}
                        </p>
                        <p className="text-orange-600 dark:text-orange-300 text-xs mt-0.5">
                            {fmtTime(existingVisit.visit_time.slice(0, 5))} · <span className="capitalize">{existingVisit.status}</span>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ── Normal flow ──────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-orange-600 text-orange-600 hover:bg-orange-50">
                    Schedule a Visit
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col gap-0 p-0">
                {/* Fixed header */}
                <div className="px-6 pt-6 pb-4 border-b">
                    <DialogTitle className="text-lg font-semibold">Schedule a Visit</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-1">
                        Choose a date and time to meet <strong>{pet.name}</strong> at {pet.shelterName ?? 'the shelter'}.
                    </DialogDescription>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                    {/* ── Step 1: Calendar ──────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-[10px] font-bold">1</span>
                            Select a Date
                        </h3>
                        <VisitCalendar petId={pet.id} selectedDate={date} onDateSelect={handleDateSelect} />
                        {errors.visit_date && (
                            <p className="text-xs text-destructive mt-2">{errors.visit_date}</p>
                        )}
                    </section>

                    {/* ── Step 2: Time slots ────────────────────────────── */}
                    {date && (
                        <section ref={slotsRef}>
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-[10px] font-bold">2</span>
                                Pick a Time Slot
                                <span className="ml-1 text-xs font-normal text-muted-foreground">— {fmtDate(date)}</span>
                            </h3>

                            {loadingSlots && (
                                <div className="grid grid-cols-3 gap-2">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="h-10 rounded-lg bg-muted animate-pulse" />
                                    ))}
                                </div>
                            )}

                            {!loadingSlots && slotMeta?.closed && (
                                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
                                    {slotMeta.message}
                                </p>
                            )}

                            {!loadingSlots && !slotMeta?.closed && slots.length === 0 && slotMeta && (
                                <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg px-4 py-3">
                                    {slotMeta.message ?? 'No slots available for this date.'}
                                </p>
                            )}

                            {!loadingSlots && slots.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                    {slots.map((slot) => (
                                        <button
                                            key={slot}
                                            type="button"
                                            onClick={() => handleTimeSelect(slot)}
                                            className={`py-2.5 px-3 rounded-lg border text-sm font-medium transition-colors text-left ${
                                                time === slot
                                                    ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                                                    : 'bg-background hover:border-orange-400 hover:text-orange-700 dark:hover:bg-orange-950/20'
                                            }`}
                                        >
                                            {fmtSlotRange(slot, slotDuration)}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {errors.visit_time && (
                                <p className="text-xs text-destructive mt-2">{errors.visit_time}</p>
                            )}
                        </section>
                    )}

                    {/* ── Step 3: Message (shown once time chosen) ──────── */}
                    {time && (
                        <section>
                            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-600 text-white text-[10px] font-bold">3</span>
                                Message
                                <span className="ml-1 text-xs font-normal text-muted-foreground">— optional</span>
                            </h3>
                            <textarea
                                rows={3}
                                maxLength={500}
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Any questions or notes for the shelter team…"
                                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            />
                            <p className="text-right text-xs text-muted-foreground mt-0.5">{message.length}/500</p>
                        </section>
                    )}
                </div>

                {/* Fixed footer */}
                <div className="px-6 py-4 border-t">
                    {/* Summary pill */}
                    {date && time && (
                        <div className="mb-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 px-4 py-2.5 text-sm text-orange-800 dark:text-orange-200">
                            <p className="font-medium">{fmtDate(date)}</p>
                            <p className="text-xs mt-0.5 text-orange-600 dark:text-orange-300">
                                {fmtSlotRange(time, slotDuration)}
                                <span className="ml-1 opacity-70">({slotDuration} min)</span>
                            </p>
                        </div>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting || !date || !time || slotMeta?.closed === true}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        {submitting ? 'Scheduling…' : 'Confirm Visit'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ---------------------------------------------------------------------------
// VisitCalendar — custom month-grid calendar with availability highlighting
// ---------------------------------------------------------------------------

const MONTH_NAMES   = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS    = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DAY_KEY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

interface VisitCalendarProps {
    petId: string;
    selectedDate: string;
    onDateSelect: (date: string) => void;
}

function VisitCalendar({ petId, selectedDate, onDateSelect }: VisitCalendarProps) {
    const now        = new Date();
    const maxAllowed = new Date(now); maxAllowed.setDate(maxAllowed.getDate() + 60);

    const [viewYear,  setViewYear]  = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-indexed
    const [bookedDates, setBookedDates] = useState<string[]>([]);
    const [closedDays,  setClosedDays]  = useState<string[]>([]);
    const [loadingCal,  setLoadingCal]  = useState(false);

    // Fetch booked/closed data whenever the visible month changes
    useEffect(() => {
        const monthStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}`;
        setLoadingCal(true);
        fetch(`/api/shelter-visits/booked-dates?pet_id=${petId}&month=${monthStr}`)
            .then((r) => r.json())
            .then((data: BookedDatesResponse) => {
                setBookedDates(data.booked_dates ?? []);
                setClosedDays(data.closed_days ?? []);
            })
            .catch(() => { /* silently degrade */ })
            .finally(() => setLoadingCal(false));
    }, [petId, viewYear, viewMonth]);

    // Month navigation guards
    const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevYear  = viewMonth === 0 ? viewYear - 1 : viewYear;
    const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextYear  = viewMonth === 11 ? viewYear + 1 : viewYear;

    const canGoPrev = prevYear > now.getFullYear() || (prevYear === now.getFullYear() && prevMonth >= now.getMonth());
    const canGoNext = nextYear < maxAllowed.getFullYear() || (nextYear === maxAllowed.getFullYear() && nextMonth <= maxAllowed.getMonth());

    const goToPrev = () => { if (!canGoPrev) return; setViewYear(prevYear); setViewMonth(prevMonth); };
    const goToNext = () => { if (!canGoNext) return; setViewYear(nextYear); setViewMonth(nextMonth); };

    // Build the grid cells: null = empty leading cell, number = day-of-month
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
        ...Array<null>(firstDayIndex).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const todayStr   = localDateStr(now);
    const maxDateStr = localDateStr(maxAllowed);

    return (
        <div className="rounded-xl border bg-card p-4">
            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={goToPrev}
                    disabled={!canGoPrev}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                        {MONTH_NAMES[viewMonth]} {viewYear}
                    </span>
                    {loadingCal && (
                        <span className="inline-block w-3 h-3 rounded-full border-2 border-orange-400 border-t-transparent animate-spin" />
                    )}
                </div>

                <button
                    type="button"
                    onClick={goToNext}
                    disabled={!canGoNext}
                    className="rounded-md p-1.5 text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Day-of-week labels */}
            <div className="grid grid-cols-7 mb-1">
                {DAY_LABELS.map((lbl) => (
                    <div key={lbl} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                        {lbl}
                    </div>
                ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
                {cells.map((day, idx) => {
                    if (day === null) return <div key={`e-${idx}`} />;

                    const dateStr   = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const dayOfWeek = DAY_KEY_NAMES[new Date(viewYear, viewMonth, day).getDay()];

                    const isPast        = dateStr < todayStr;
                    const isBeyondLimit = dateStr > maxDateStr;
                    const isClosed      = closedDays.includes(dayOfWeek);
                    const isFullyBooked = bookedDates.includes(dateStr);
                    const isToday       = dateStr === todayStr;
                    const isSelected    = dateStr === selectedDate;
                    const isDisabled    = isPast || isBeyondLimit || isClosed || isFullyBooked;

                    // Determine the small status label under the day number
                    let subLabel = '';
                    if (!isPast && !isBeyondLimit) {
                        if (isClosed)      subLabel = 'Closed';
                        else if (isFullyBooked) subLabel = 'Full';
                    }

                    return (
                        <button
                            key={day}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => !isDisabled && onDateSelect(dateStr)}
                            className={[
                                'relative flex flex-col items-center justify-center rounded-lg py-1.5 text-sm font-medium transition-colors',
                                isSelected
                                    ? 'bg-orange-600 text-white shadow-sm'
                                    : isFullyBooked && !isPast && !isBeyondLimit
                                        ? 'bg-red-50 text-red-400 dark:bg-red-950/30 dark:text-red-400'
                                        : isClosed || isPast || isBeyondLimit
                                            ? 'text-muted-foreground/40'
                                            : 'hover:bg-orange-50 hover:text-orange-700 dark:hover:bg-orange-950/20 cursor-pointer',
                                isToday && !isSelected ? 'ring-2 ring-orange-400 ring-offset-1' : '',
                                isDisabled ? 'cursor-not-allowed' : '',
                            ].filter(Boolean).join(' ')}
                            aria-label={`${day} ${MONTH_NAMES[viewMonth]}${isDisabled ? (isClosed ? ' — closed' : isFullyBooked ? ' — fully booked' : ' — unavailable') : ''}`}
                            aria-pressed={isSelected}
                        >
                            {day}
                            {subLabel && (
                                <span className="text-[9px] leading-none mt-0.5 font-normal">{subLabel}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground border-t pt-3">
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm ring-2 ring-orange-400" /> Today
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-orange-600" /> Selected
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-red-100 dark:bg-red-950/40" /> Fully booked
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-3 rounded-sm bg-muted opacity-50" /> Unavailable
                </span>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// ImageManager — shelter staff / admin only (unchanged)
// ---------------------------------------------------------------------------

interface ImageManagerProps {
    petId: string;
    images: PetImage[];
}

function ImageManager({ petId, images }: ImageManagerProps) {
    const [uploading, setUploading] = useState(false);
    const [imageUrl,  setImageUrl]  = useState('');
    const [showUrl,   setShowUrl]   = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const sorted = [...images].sort((a, b) => a.order - b.order);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        router.post(`/pets/${petId}/images`, { image: file }, {
            forceFormData: true,
            onFinish: () => { setUploading(false); if (fileRef.current) fileRef.current.value = ''; },
        });
    };

    const handleUrlUpload = () => {
        if (!imageUrl.trim()) return;
        setUploading(true);
        router.post(`/pets/${petId}/images`, { image_url: imageUrl }, {
            onFinish: () => { setUploading(false); setImageUrl(''); setShowUrl(false); },
        });
    };

    return (
        <div className="mt-10 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-5">
                <h3 className="font-display text-lg flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" /> Manage Images
                </h3>
                <div className="flex items-center gap-2">
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={handleFileUpload} />
                    <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-1" /> {uploading ? 'Uploading…' : 'Upload File'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowUrl((v) => !v)}>Add URL</Button>
                </div>
            </div>

            {showUrl && (
                <div className="flex gap-2 mb-4">
                    <input type="url" placeholder="https://example.com/photo.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="flex-1 h-9 rounded-md border bg-background px-3 text-sm" />
                    <Button size="sm" onClick={handleUrlUpload} disabled={uploading || !imageUrl.trim()}>Add</Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowUrl(false)}>Cancel</Button>
                </div>
            )}

            {sorted.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No images yet. Upload one above.</p>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {sorted.map((img, i) => (
                        <div key={img.id} className={`relative rounded-xl overflow-hidden border group ${img.isPrimary ? 'ring-2 ring-primary' : ''}`}>
                            <img src={img.url} alt="" className="w-full aspect-square object-cover" />
                            {img.isPrimary && (
                                <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5" /> Primary
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5">
                                {!img.isPrimary && (
                                    <button onClick={() => router.patch(`/pet-images/${img.id}/primary`)} className="text-xs bg-white/90 text-foreground rounded px-2 py-1 font-medium hover:bg-white flex items-center gap-1">
                                        <Star className="w-3 h-3" /> Set Primary
                                    </button>
                                )}
                                <div className="flex gap-1">
                                    <button onClick={() => { const idx = sorted.findIndex((x) => x.id === img.id); if (idx === 0) return; const o = sorted.map((x) => x.id); [o[idx], o[idx-1]] = [o[idx-1], o[idx]]; router.post(`/pets/${petId}/images/reorder`, { order: o }); }} disabled={i === 0} className="bg-white/80 text-foreground rounded p-1 hover:bg-white disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                    <button onClick={() => { const idx = sorted.findIndex((x) => x.id === img.id); if (idx === sorted.length - 1) return; const o = sorted.map((x) => x.id); [o[idx], o[idx+1]] = [o[idx+1], o[idx]]; router.post(`/pets/${petId}/images/reorder`, { order: o }); }} disabled={i === sorted.length - 1} className="bg-white/80 text-foreground rounded p-1 hover:bg-white disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                                    <button onClick={() => { if (!confirm('Remove this image?')) return; router.delete(`/pet-images/${img.id}`); }} className="bg-red-500 text-white rounded p-1 hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// FavoriteDialog (unchanged)
// ---------------------------------------------------------------------------

function FavoriteDialog({ pet }: { pet: Pet }) {
    const { isFavorite, toggle, remove } = useFavorites();
    const fav = isFavorite(pet.id);

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    onClick={() => toggle(pet.id)}
                    className={`rounded-full p-3 shadow ${fav ? 'bg-red-50' : 'bg-background/80'} hover:bg-red-50`}
                >
                    <Heart className={`w-5 h-5 ${fav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                </button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogTitle>{fav ? 'Saved to favorites' : 'Added to favorites'}</DialogTitle>
                <DialogDescription>
                    <div className="flex gap-4 mt-4">
                        {pet.imageUrl && <img src={pet.imageUrl} alt={pet.name} className="w-20 h-20 object-cover rounded-lg" />}
                        <div>
                            <div className="font-semibold">{pet.name}</div>
                            <div className="text-sm text-muted-foreground">{pet.breed}</div>
                            <div className="text-sm text-muted-foreground mt-2">Shelter: {pet.shelterName}</div>
                            <div className="text-sm text-muted-foreground mt-2">Fee: ${pet.adoptionFee}</div>
                            <div className="mt-4 flex gap-2">
                                <Link href={`/apply?pet=${pet.id}`}><Button>Apply to Adopt</Button></Link>
                                <Button variant="outline" onClick={() => remove(pet.id)}>Remove</Button>
                            </div>
                        </div>
                    </div>
                </DialogDescription>
            </DialogContent>
        </Dialog>
    );
}
