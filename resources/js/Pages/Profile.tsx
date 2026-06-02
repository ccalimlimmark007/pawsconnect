import { Head, Link, router, usePage } from '@inertiajs/react';
import { CheckCircle, Info, User, PawPrint, Heart, Settings, ClipboardList, Clock, CheckCircle2, XCircle, Calendar, AlertCircle, CalendarCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import useFavorites from '@/hooks/use-favorites';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
        href: '/profile',
    },
];

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

type ShelterVisit = {
    id: number;
    petId: string;
    petName: string | null;
    petImage: string | null;
    visitDate: string;
    visitTime: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    message: string | null;
};

type Application = {
    id: number;
    status: string;
    createdAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    pet: { id: string; name: string; species: string; imageUrl: string | null } | null;
    notes: string | null;
    rejectedReason: string | null;
    homeVisit: {
        visitDateFormatted: string;
        status: 'scheduled' | 'completed' | 'cancelled';
        assignedStaffName: string | null;
        notes: string | null;
    } | null;
};

const appStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    started:  { label: 'Draft',        color: 'text-gray-600 dark:text-gray-400',    icon: Clock },
    pending:  { label: 'Under Review', color: 'text-yellow-700 dark:text-yellow-400', icon: Clock },
    approved: { label: 'Approved',     color: 'text-green-700 dark:text-green-400',   icon: CheckCircle2 },
    rejected: { label: 'Not Approved', color: 'text-red-700 dark:text-red-400',       icon: XCircle },
};

const appBadgeColors: Record<string, string> = {
    started:  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

export default function Profile() {
    const props = usePage().props;
    const { auth, status, adopterProfile, applications: rawApplications, favoritePets: rawFavoritePets, shelterVisits: rawShelterVisits } = props as {
        auth?: { user?: {
            name: string;
            email: string;
            role?: string;
            created_at: string;
            email_verified_at?: string;
        } };
        status?: string;
        adopterProfile?: AdopterProfile | null;
        applications?: Application[];
        favoritePets?: FavoritePet[];
        shelterVisits?: ShelterVisit[];
    };

    type AdopterProfile = {
        home_type?: string | null;
        has_yard?: boolean | null;
        activity_level?: string | null;
        experience_level?: string | null;
        preferred_species?: string[];
        preferred_size?: string[];
    };

    const [showStatus, setShowStatus] = useState(!!status);
    const applications   = Array.isArray(rawApplications)   ? rawApplications   : [];
    const shelterVisits  = Array.isArray(rawShelterVisits)  ? rawShelterVisits  : [];
    const { toggle } = useFavorites();

    // Seed from server (always accurate on page load); removals update optimistically.
    const [displayedFavs, setDisplayedFavs] = useState<FavoritePet[]>(
        Array.isArray(rawFavoritePets) ? rawFavoritePets : []
    );

    const handleRemoveFavorite = (pet: FavoritePet) => {
        setDisplayedFavs(prev => prev.filter(p => p.id !== pet.id));
        void toggle(pet.id, pet.name);
    };

    const user = auth?.user;

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => setShowStatus(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Poll every 30 s so status changes made by staff (pending → confirmed) are
    // reflected without the user needing to manually refresh.
    useEffect(() => {
        if (user?.role !== 'adopter' || shelterVisits.length === 0) return;
        const id = setInterval(() => {
            router.reload({ only: ['shelterVisits'] });
        }, 30_000);
        return () => clearInterval(id);
    }, [user?.role, shelterVisits.length]);

    if (!user) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="My Profile" />
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <p className="text-muted-foreground mb-4">Unable to load profile. Please try logging in again.</p>
                        <p className="text-xs text-gray-500">Auth data: {JSON.stringify(auth)}</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const formatDate = (dateString: string) =>
        new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="mb-6">
                        <h1 className="text-4xl font-serif">My Profile</h1>
                        <p className="text-muted-foreground mt-2">Manage your account and track your adoption applications</p>
                    </div>

                    {showStatus && status && (
                        <div className={`mb-6 rounded-lg border p-4 ${
                            status.includes('No changes')
                                ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
                                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                        }`}>
                            <div className="flex items-center gap-3">
                                {status.includes('No changes') ? (
                                    <Info className="h-5 w-5" />
                                ) : (
                                    <CheckCircle className="h-5 w-5" />
                                )}
                                <p className="font-medium">{status}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left column: profile card + adoption preferences */}
                        <div className="flex flex-col gap-6">
                            {/* Profile card */}
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <div className="flex flex-col items-center text-center">
                                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                        <User className="h-12 w-12" />
                                    </div>
                                    <h2 className="text-xl font-semibold">{user.name}</h2>
                                    <p className="text-sm text-muted-foreground mt-2">{user.email}</p>

                                    <div className="my-4 w-full border-t pt-4 text-sm text-muted-foreground">
                                        <div>Joined {formatDate(user.created_at)}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Adoption Preferences card — adopter only */}
                            {user.role === 'adopter' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Heart className="h-5 w-5 text-primary" />
                                            Adoption Preferences
                                        </h3>
                                        <Link href="/profile/preferences">
                                            <Button size="sm" variant="ghost" className="gap-2 text-muted-foreground">
                                                <Settings className="h-4 w-4" />
                                                Edit
                                            </Button>
                                        </Link>
                                    </div>
                                    {adopterProfile ? (
                                        <div className="space-y-3 text-sm">
                                            {(adopterProfile.preferred_species?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Species</span>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {adopterProfile.preferred_species!.map(s => (
                                                            <span key={s} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {(adopterProfile.preferred_size?.length ?? 0) > 0 && (
                                                <div>
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Size</span>
                                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                                        {adopterProfile.preferred_size!.map(s => (
                                                            <span key={s} className="px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {adopterProfile.home_type && (
                                                <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                                    <span>Home: <strong className="text-foreground capitalize">{adopterProfile.home_type}</strong></span>
                                                    {adopterProfile.has_yard !== null && adopterProfile.has_yard !== undefined && (
                                                        <span>Yard: <strong className="text-foreground">{adopterProfile.has_yard ? 'Yes' : 'No'}</strong></span>
                                                    )}
                                                    {adopterProfile.activity_level && (
                                                        <span>Activity: <strong className="text-foreground capitalize">{adopterProfile.activity_level}</strong></span>
                                                    )}
                                                </div>
                                            )}
                                            <Link href="/pets">
                                                <Button size="sm" variant="outline" className="mt-2 gap-2 w-full">
                                                    <PawPrint className="h-4 w-4" />
                                                    Browse Matched Pets
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center py-6 text-center">
                                            <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
                                            <p className="text-sm font-medium mb-1">No preferences set yet</p>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Tell us what you're looking for and we'll match you with the right pets.
                                            </p>
                                            <Link href="/profile/preferences">
                                                <Button size="sm" className="gap-2">
                                                    <Settings className="h-4 w-4" />
                                                    Set Up Preferences
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right column: applications (top) + favorites (bottom) */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* My Applications section — adopters only */}
                            {user.role === 'adopter' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-primary" />
                                            My Applications
                                        </h3>
                                        {applications.length > 0 && (
                                            <Link href="/my-applications">
                                                <Button size="sm" variant="ghost" className="text-muted-foreground gap-1">
                                                    View All
                                                </Button>
                                            </Link>
                                        )}
                                    </div>

                                    {applications.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-10">
                                            <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
                                            <h4 className="mb-1 text-base font-medium">No applications yet</h4>
                                            <p className="text-sm text-muted-foreground mb-6">Take the quiz to find your perfect pet match!</p>
                                            <Link href="/quiz">
                                                <Button className="shadow-md bg-primary text-white">Find My Match</Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {applications.slice(0, 3).map((app) => {
                                                const cfg = appStatusConfig[app.status] ?? appStatusConfig.started;
                                                const StatusIcon = cfg.icon;
                                                return (
                                                    <div key={app.id} className="rounded-lg border border-border/50 overflow-hidden flex gap-0">
                                                        {app.pet?.imageUrl && (
                                                            <div className="w-20 shrink-0 hidden sm:block">
                                                                <img src={app.pet.imageUrl} alt={app.pet.name} className="h-full w-full object-cover" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 p-4">
                                                            <div className="flex items-start justify-between gap-3 flex-wrap">
                                                                <div>
                                                                    {app.pet ? (
                                                                        <>
                                                                            <Link href={`/pets/${app.pet.id}`} className="font-semibold hover:underline text-sm">{app.pet.name}</Link>
                                                                            <p className="text-xs text-muted-foreground capitalize">{app.pet.species}</p>
                                                                        </>
                                                                    ) : (
                                                                        <p className="text-sm font-semibold text-muted-foreground">Pet no longer available</p>
                                                                    )}
                                                                </div>
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${appBadgeColors[app.status] ?? ''}`}>
                                                                    {cfg.label}
                                                                </span>
                                                            </div>
                                                            <div className={`flex items-center gap-1.5 mt-2 text-xs ${cfg.color}`}>
                                                                <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                                                                <span>Applied {app.createdAt ?? '—'}</span>
                                                            </div>
                                                            {app.homeVisit && app.homeVisit.status !== 'cancelled' && (
                                                                <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                                                                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                                                                    <span>Home visit: {app.homeVisit.visitDateFormatted}</span>
                                                                </div>
                                                            )}
                                                            {app.status === 'started' && app.pet && (
                                                                <div className="mt-2">
                                                                    <Link href={`/apply?pet=${app.pet.id}`}>
                                                                        <Button size="sm" variant="outline" className="h-7 text-xs">Continue Application</Button>
                                                                    </Link>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {applications.length > 3 && (
                                                <Link href="/my-applications" className="block text-center">
                                                    <Button variant="outline" size="sm" className="w-full mt-1">
                                                        View all {applications.length} applications
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* My Visit Requests section — adopters only */}
                            {user.role === 'adopter' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <CalendarCheck className="h-5 w-5 text-primary" />
                                            My Visit Requests
                                            {shelterVisits.length > 0 && (
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    ({shelterVisits.length})
                                                </span>
                                            )}
                                        </h3>
                                        {shelterVisits.length > 0 && (
                                            <Link href="/my-visits">
                                                <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                                                    View All
                                                </button>
                                            </Link>
                                        )}
                                    </div>

                                    {shelterVisits.length === 0 ? (
                                        <div className="flex flex-col items-center py-6 text-center">
                                            <CalendarCheck className="mb-3 h-10 w-10 text-muted-foreground" />
                                            <p className="text-sm font-medium mb-1">No upcoming visits</p>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Book a shelter visit from any pet's page to meet them in person.
                                            </p>
                                            <Link href="/pets">
                                                <button className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent transition-colors">
                                                    <PawPrint className="h-4 w-4" />
                                                    Browse Pets
                                                </button>
                                            </Link>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {shelterVisits.map(visit => {
                                                const isPending   = visit.status === 'pending';
                                                const isConfirmed = visit.status === 'confirmed';
                                                return (
                                                    <div key={visit.id} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                                                        {/* Pet thumbnail */}
                                                        <div className="w-12 h-12 shrink-0 rounded-md overflow-hidden bg-secondary">
                                                            {visit.petImage ? (
                                                                <img src={visit.petImage} alt={visit.petName ?? ''} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center">
                                                                    <PawPrint className="h-5 w-5 text-muted-foreground" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <Link href={`/pets/${visit.petId}`} className="text-sm font-semibold hover:underline truncate block">
                                                                {visit.petName ?? 'Unknown Pet'}
                                                            </Link>
                                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                                                <Calendar className="h-3 w-3 shrink-0" />
                                                                <span>{visit.visitDate} at {visit.visitTime}</span>
                                                            </div>
                                                        </div>

                                                        {/* Status badge */}
                                                        <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            isPending   ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200' :
                                                            isConfirmed ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200' :
                                                                          'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                                                        }`}>
                                                            {isPending   && <Clock className="h-3 w-3" />}
                                                            {isConfirmed && <CheckCircle2 className="h-3 w-3" />}
                                                            {isPending ? 'Pending' : isConfirmed ? 'Confirmed' : visit.status}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* My Favorites section — adopters only */}
                            {user.role === 'adopter' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold flex items-center gap-2">
                                            <Heart className="h-5 w-5 text-primary" />
                                            My Favorites
                                            {displayedFavs.length > 0 && (
                                                <span className="text-xs font-normal text-muted-foreground">
                                                    ({displayedFavs.length})
                                                </span>
                                            )}
                                        </h3>
                                        {displayedFavs.length > 0 && (
                                            <Link href="/my-favorites">
                                                <Button size="sm" variant="ghost" className="text-muted-foreground gap-1">
                                                    View All
                                                </Button>
                                            </Link>
                                        )}
                                    </div>

                                    {displayedFavs.length === 0 ? (
                                        <div className="flex flex-col items-center py-6 text-center">
                                            <Heart className="mb-3 h-10 w-10 text-muted-foreground" />
                                            <p className="text-sm font-medium mb-1">No favorites yet</p>
                                            <p className="text-xs text-muted-foreground mb-4">
                                                Tap the heart icon on any pet to save them here.
                                            </p>
                                            <Link href="/pets">
                                                <Button size="sm" variant="outline" className="gap-2">
                                                    <PawPrint className="h-4 w-4" />
                                                    Browse Pets
                                                </Button>
                                            </Link>
                                        </div>
                                    ) : (
                                        /* Horizontal scroll strip */
                                        <div className="overflow-x-auto -mx-2 px-2 pb-1">
                                            <div className="flex gap-3 w-max">
                                                {displayedFavs.map(pet => (
                                                    <div key={pet.id} className="relative group w-36 shrink-0 rounded-lg overflow-hidden border border-border/50 bg-background">
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
                                                                        <PawPrint className="h-8 w-8 text-muted-foreground" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="p-2.5">
                                                                <p className="text-sm font-semibold truncate">{pet.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate capitalize">{pet.species} · {pet.breed}</p>
                                                                {pet.adoptionFee > 0 && (
                                                                    <p className="text-xs font-medium text-primary mt-0.5">₱{pet.adoptionFee.toLocaleString()}</p>
                                                                )}
                                                            </div>
                                                        </Link>
                                                        <button
                                                            onClick={() => handleRemoveFavorite(pet)}
                                                            aria-label="Remove from favorites"
                                                            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 dark:hover:bg-rose-950"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                                                                <path d="M12 21s-7.5-4.9-10-8.2A5.5 5.5 0 0 1 3 7.5C3 5 5 3 7.5 3c1.6 0 3 .9 4.5 2.4C13.5 3.9 14.9 3 16.5 3 19 3 21 5 21 7.5c0 1.9-.7 3.5-1.9 5.3C19.5 16.1 12 21 12 21z" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
