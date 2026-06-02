import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList, CheckCircle2, XCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pets', href: '/pets' },
    { title: 'My Applications', href: '/my-applications' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface PetSnippet {
    id: string;
    name: string;
    species: string;
    imageUrl: string | null;
}

interface HomeVisit {
    visitDateFormatted: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    assignedStaffName: string | null;
    notes: string | null;
}

interface Application {
    id: number;
    status: string;
    createdAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    pet: PetSnippet | null;
    notes: string | null;
    rejectedReason: string | null;
    homeVisit: HomeVisit | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType; description: string }> = {
    started:  {
        label: 'Draft',
        color: 'text-gray-600 dark:text-gray-400',
        icon: Clock,
        description: 'Your application has been started but not yet submitted.',
    },
    pending:  {
        label: 'Under Review',
        color: 'text-yellow-700 dark:text-yellow-400',
        icon: Clock,
        description: 'Your application is being reviewed by the shelter.',
    },
    approved: {
        label: 'Approved',
        color: 'text-green-700 dark:text-green-400',
        icon: CheckCircle2,
        description: 'Congratulations! Your application has been approved.',
    },
    rejected: {
        label: 'Not Approved',
        color: 'text-red-700 dark:text-red-400',
        icon: XCircle,
        description: 'Your application was not approved at this time.',
    },
};

const badgeColors: Record<string, string> = {
    started:  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

// ─── Application Card ─────────────────────────────────────────────────────────

function ApplicationCard({ app }: { app: Application }) {
    const cfg = statusConfig[app.status] ?? statusConfig.started;
    const StatusIcon = cfg.icon;

    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
            <div className="flex gap-0">
                {/* Pet image */}
                {app.pet?.imageUrl && (
                    <div className="w-32 shrink-0 hidden sm:block">
                        <img
                            src={app.pet.imageUrl}
                            alt={app.pet.name}
                            className="h-full w-full object-cover"
                        />
                    </div>
                )}

                <div className="flex-1 p-5">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div>
                            {app.pet ? (
                                <>
                                    <Link href={`/pets/${app.pet.id}`} className="font-semibold text-lg hover:underline">
                                        {app.pet.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground capitalize">{app.pet.species}</p>
                                </>
                            ) : (
                                <p className="font-semibold text-lg text-muted-foreground">Pet no longer available</p>
                            )}
                        </div>

                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[app.status] ?? ''}`}>
                            {cfg.label}
                        </span>
                    </div>

                    {/* Status description */}
                    <div className={`flex items-center gap-1.5 mt-3 text-sm ${cfg.color}`}>
                        <StatusIcon className="h-4 w-4 shrink-0" />
                        <span>{cfg.description}</span>
                    </div>

                    {/* Rejection reason — shown to applicant */}
                    {app.status === 'rejected' && app.rejectedReason && (
                        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                            <p className="text-xs font-semibold text-destructive uppercase tracking-wide mb-1">Reason</p>
                            <p className="text-sm whitespace-pre-wrap">{app.rejectedReason}</p>
                        </div>
                    )}

                    {/* Home visit */}
                    {app.homeVisit && app.homeVisit.status !== 'cancelled' && (
                        <div className={`mt-3 rounded-lg border px-4 py-3 text-sm ${
                            app.homeVisit.status === 'completed'
                                ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                                : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                        }`}>
                            <p className="flex items-center gap-1.5 font-semibold mb-1">
                                <Calendar className="h-4 w-4" />
                                {app.homeVisit.status === 'completed' ? 'Home Visit Completed' : 'Home Visit Scheduled'}
                            </p>
                            <p>{app.homeVisit.visitDateFormatted}</p>
                            {app.homeVisit.assignedStaffName && (
                                <p className="text-muted-foreground text-xs mt-0.5">Staff: {app.homeVisit.assignedStaffName}</p>
                            )}
                            {app.homeVisit.notes && (
                                <p className="mt-1 text-xs whitespace-pre-wrap">{app.homeVisit.notes}</p>
                            )}
                        </div>
                    )}

                    {/* Reviewer + date */}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Applied {app.createdAt ?? '—'}</span>
                        {app.reviewedBy && (
                            <span>Reviewed by {app.reviewedBy} on {app.reviewedAt ?? '—'}</span>
                        )}
                    </div>

                    {/* CTA for draft */}
                    {app.status === 'started' && app.pet && (
                        <div className="mt-4">
                            <Link href={`/apply?pet=${app.pet.id}`}>
                                <Button size="sm" variant="outline">Continue Application</Button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MyApplications({ applications }: { applications: Application[] }) {
    const pending  = applications.filter(a => a.status === 'pending').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Applications" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-8">
                <div className="mx-auto w-full max-w-3xl">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/pets">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back to Pets
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-serif flex items-center gap-3">
                                <ClipboardList className="h-8 w-8" />
                                My Applications
                            </h1>
                            <p className="text-muted-foreground mt-1">{applications.length} total</p>
                        </div>
                    </div>

                    {/* Summary row */}
                    {applications.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{pending}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Under Review</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{approved}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Approved</p>
                            </div>
                            <div className="rounded-lg border border-border bg-card px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400">{rejected}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Not Approved</p>
                            </div>
                        </div>
                    )}

                    {/* Application list */}
                    {applications.length === 0 ? (
                        <div className="rounded-xl border border-sidebar-border/70 bg-card px-8 py-16 text-center">
                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold mb-2">No applications yet</p>
                            <p className="text-sm text-muted-foreground mb-6">
                                When you apply to adopt a pet, your applications will appear here.
                            </p>
                            <Link href="/pets">
                                <Button>Browse Pets</Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {applications.map(app => (
                                <ApplicationCard key={app.id} app={app} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
