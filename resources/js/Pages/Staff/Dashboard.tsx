import { Head, Link } from '@inertiajs/react';
import { PawPrint, FileText, Plus, Eye, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Dashboard', href: '/staff/dashboard' },
];

interface Pet {
    id: string;
    name: string;
    species: string;
    breed: string | null;
    availabilityStatus: boolean;
    pendingCount: number;
    imageUrl: string | null;
    createdAt: string;
}

interface RecentApplication {
    id: number;
    status: string;
    createdAt: string;
    user: { name: string; email: string } | null;
    pet: { id: string; name: string } | null;
}

const statusColors: Record<string, string> = {
    started: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
};

export default function StaffDashboard({
    myPets,
    totalPets,
    totalPending,
    recentApplications,
}: {
    myPets: Pet[];
    totalPets: number;
    totalPending: number;
    recentApplications: RecentApplication[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Staff Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-serif">Staff Dashboard</h1>
                            <p className="text-muted-foreground mt-2">
                                Manage your animals and review adoption applications
                            </p>
                        </div>
                        <Link href="/post-pet">
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Post New Animal
                            </Button>
                        </Link>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">My Animals</span>
                                <PawPrint className="h-5 w-5 text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold">{totalPets}</p>
                        </div>
                        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-muted-foreground">Pending Applications</span>
                                <Clock className="h-5 w-5 text-orange-600" />
                            </div>
                            <p className="text-3xl font-bold">{totalPending}</p>
                        </div>
                    </div>

                    {/* Main panels */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* My Animals */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">My Animals</h2>
                                <Link href="/post-pet">
                                    <Button variant="ghost" size="sm" className="gap-1 text-xs">
                                        <Plus className="h-3.5 w-3.5" /> Add Animal
                                    </Button>
                                </Link>
                            </div>
                            <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                                {myPets.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No animals posted yet.{' '}
                                        <Link href="/post-pet" className="underline hover:text-foreground">
                                            Post one now.
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {myPets.map((pet) => (
                                            <div key={pet.id} className="flex items-center gap-3 p-4">
                                                {pet.imageUrl ? (
                                                    <img
                                                        src={pet.imageUrl}
                                                        alt={pet.name}
                                                        className="h-10 w-10 rounded-lg object-cover shrink-0"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-lg bg-secondary shrink-0 flex items-center justify-center">
                                                        <PawPrint className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium truncate">{pet.name}</p>
                                                    <p className="text-xs text-muted-foreground capitalize">
                                                        {pet.species}
                                                        {pet.breed ? ` · ${pet.breed}` : ''}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {pet.pendingCount > 0 && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200 font-medium">
                                                            {pet.pendingCount} pending
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                                            pet.availabilityStatus
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200'
                                                                : 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {pet.availabilityStatus ? 'Available' : 'Adopted'}
                                                    </span>
                                                    <Link href={`/pets/${pet.id}`}>
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pending Applications */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Pending Applications</h2>
                                <Link href="/admin/applications">
                                    <Button variant="ghost" size="sm" className="text-xs">
                                        View All
                                    </Button>
                                </Link>
                            </div>
                            <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                                {recentApplications.length === 0 ? (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        No pending applications at this time.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border/50">
                                        {recentApplications.map((app) => (
                                            <div
                                                key={app.id}
                                                className="flex items-center justify-between gap-3 p-4"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate">
                                                        {app.user?.name ?? 'Unknown applicant'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        for {app.pet?.name ?? '—'} · {app.createdAt}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${statusColors[app.status] ?? ''}`}
                                                >
                                                    {app.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="mt-6">
                        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link href="/admin/applications">
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                    <FileText className="h-8 w-8 text-orange-600 mb-3" />
                                    <h3 className="font-semibold text-lg">Review Applications</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {totalPending} application{totalPending !== 1 ? 's' : ''} awaiting review
                                    </p>
                                </div>
                            </Link>
                            <Link href="/post-pet">
                                <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                    <PawPrint className="h-8 w-8 text-blue-600 mb-3" />
                                    <h3 className="font-semibold text-lg">Post New Animal</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Add a new animal to the adoption listings
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
