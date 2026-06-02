import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft, FileText, Eye, Home, Users, Clock, BookOpen,
    CheckCircle2, XCircle, MessageSquare, CalendarPlus, Calendar,
    CalendarCheck, CalendarX, Pencil, Paperclip, Download,
} from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Applications', href: '/admin/applications' },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface Reference {
    name: string;
    relationship: string;
    contact: string;
}

interface AppDocument {
    id: number;
    type: string;
    originalName: string;
    uploadedAt: string | null;
    downloadUrl: string;
}

interface HomeVisit {
    id: number;
    visitDate: string;
    visitDateFormatted: string;
    status: 'scheduled' | 'completed' | 'cancelled';
    assignedStaffId: number | null;
    assignedStaffName: string | null;
    notes: string | null;
}

interface Application {
    id: number;
    status: string;
    startedAt: string | null;
    createdAt: string | null;
    reviewedAt: string | null;
    reviewedBy: string | null;
    user: { id: number; name: string; email: string } | null;
    pet: { id: string; name: string; species: string } | null;
    homeType: string | null;
    hasYard: boolean | null;
    hasChildren: boolean | null;
    hasOtherPets: boolean | null;
    otherPetsDescription: string | null;
    workHoursPerDay: number | null;
    reasonForAdopting: string | null;
    priorPetExperience: string | null;
    references: Reference[] | null;
    notes: string | null;
    rejectedReason: string | null;
    documents: AppDocument[];
    homeVisit: HomeVisit | null;
}

interface StaffMember {
    id: number;
    name: string;
    email: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    started:  'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    pending:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200',
    approved: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
};

const visitStatusConfig = {
    scheduled:  { label: 'Visit Scheduled', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200', icon: Calendar },
    completed:  { label: 'Visit Completed', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200', icon: CalendarCheck },
    cancelled:  { label: 'Visit Cancelled', color: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-400', icon: CalendarX },
};

function YesNo({ value }: { value: boolean | null }) {
    if (value === null) return <span className="text-muted-foreground">—</span>;
    return <span className={value ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>{value ? 'Yes' : 'No'}</span>;
}

function QRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="grid grid-cols-[180px_1fr] gap-2 py-1.5 border-b border-border/40 last:border-0">
            <span className="text-sm text-muted-foreground shrink-0">{label}</span>
            <span className="text-sm">{children}</span>
        </div>
    );
}

function QSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
    return (
        <div>
            <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
            </h4>
            <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-1">
                {children}
            </div>
        </div>
    );
}

// ─── Details Dialog ───────────────────────────────────────────────────────────

function DetailsDialog({ app, open, onClose }: { app: Application | null; open: boolean; onClose: () => void }) {
    if (!app) return null;

    const hasQuestionnaire = app.homeType !== null;
    const visit = app.homeVisit;

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Application #{app.id}</DialogTitle>
                    <DialogDescription>
                        {app.user?.name ?? 'Unknown applicant'} applying for{' '}
                        {app.pet?.name ?? 'unknown pet'} · submitted {app.createdAt ?? '—'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] ?? ''}`}>
                        {app.status}
                    </span>
                    {app.user && <span className="text-sm text-muted-foreground">{app.user.email}</span>}
                    {app.reviewedBy && (
                        <span className="text-xs text-muted-foreground ml-auto">
                            Reviewed by {app.reviewedBy} on {app.reviewedAt ?? '—'}
                        </span>
                    )}
                </div>

                {/* Review notes / rejection */}
                {(app.notes || app.rejectedReason) && (
                    <div className="space-y-2">
                        {app.notes && (
                            <div className="rounded-lg border border-border/60 bg-secondary/20 px-4 py-3">
                                <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">Staff Notes</p>
                                <p className="text-sm whitespace-pre-wrap">{app.notes}</p>
                            </div>
                        )}
                        {app.rejectedReason && (
                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                                <p className="text-xs font-semibold text-destructive mb-1 uppercase tracking-wide">Rejection Reason</p>
                                <p className="text-sm whitespace-pre-wrap">{app.rejectedReason}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Home visit info */}
                {visit && (
                    <div className={`rounded-lg border px-4 py-3 ${
                        visit.status === 'completed'
                            ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                            : visit.status === 'cancelled'
                            ? 'border-border/60 bg-secondary/20'
                            : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                    }`}>
                        <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-muted-foreground">Home Visit</p>
                        <div className="space-y-1 text-sm">
                            <div className="flex gap-2">
                                <span className="text-muted-foreground w-28 shrink-0">Date</span>
                                <span>{visit.visitDateFormatted}</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-muted-foreground w-28 shrink-0">Status</span>
                                <span className="capitalize">{visit.status}</span>
                            </div>
                            {visit.assignedStaffName && (
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground w-28 shrink-0">Assigned to</span>
                                    <span>{visit.assignedStaffName}</span>
                                </div>
                            )}
                            {visit.notes && (
                                <div className="flex gap-2">
                                    <span className="text-muted-foreground w-28 shrink-0">Notes</span>
                                    <span className="whitespace-pre-wrap">{visit.notes}</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Documents */}
                {app.documents && app.documents.length > 0 && (
                    <div>
                        <h4 className="flex items-center gap-2 text-sm font-semibold mb-2">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            Documents ({app.documents.length})
                        </h4>
                        <div className="rounded-lg border border-border/60 bg-secondary/20 divide-y divide-border/40">
                            {app.documents.map(doc => (
                                <div key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{doc.originalName}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {doc.type.replace(/_/g, ' ')} · {doc.uploadedAt ?? '—'}
                                        </p>
                                    </div>
                                    <a
                                        href={doc.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium hover:bg-secondary transition-colors"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {hasQuestionnaire ? (
                    <div className="space-y-5 mt-2">
                        <QSection icon={Home} title="Home">
                            <QRow label="Home type"><span className="capitalize">{app.homeType}</span></QRow>
                            <QRow label="Has yard"><YesNo value={app.hasYard} /></QRow>
                        </QSection>
                        <QSection icon={Users} title="Household">
                            <QRow label="Has children"><YesNo value={app.hasChildren} /></QRow>
                            <QRow label="Has other pets"><YesNo value={app.hasOtherPets} /></QRow>
                            {app.hasOtherPets && app.otherPetsDescription && (
                                <QRow label="Other pets">{app.otherPetsDescription}</QRow>
                            )}
                        </QSection>
                        <QSection icon={Clock} title="Lifestyle">
                            <QRow label="Hours away / day">
                                {app.workHoursPerDay !== null ? `${app.workHoursPerDay} hrs` : '—'}
                            </QRow>
                            <QRow label="Reason for adopting">
                                <span className="whitespace-pre-wrap">{app.reasonForAdopting ?? '—'}</span>
                            </QRow>
                            {app.priorPetExperience && (
                                <QRow label="Prior experience">
                                    <span className="whitespace-pre-wrap">{app.priorPetExperience}</span>
                                </QRow>
                            )}
                        </QSection>
                        {app.references && app.references.length > 0 && (
                            <QSection icon={BookOpen} title="References">
                                {app.references.map((ref, i) => (
                                    <div key={i} className="py-1.5 border-b border-border/40 last:border-0">
                                        <p className="text-sm font-medium">{ref.name} <span className="font-normal text-muted-foreground">· {ref.relationship}</span></p>
                                        <p className="text-sm text-muted-foreground">{ref.contact}</p>
                                    </div>
                                ))}
                            </QSection>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                        This application was started but the questionnaire has not been completed yet.
                    </p>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ─── Review Dialog ────────────────────────────────────────────────────────────

type ReviewAction = 'approved' | 'rejected';

function ReviewDialog({
    app, action, open, onClose,
}: {
    app: Application | null;
    action: ReviewAction | null;
    open: boolean;
    onClose: () => void;
}) {
    const [form, setForm] = useState({ notes: '', rejected_reason: '' });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!app || !action) return null;
    const isRejection = action === 'rejected';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isRejection && !form.rejected_reason.trim()) {
            setError('A rejection reason is required.');
            return;
        }
        setError(null);
        setSubmitting(true);
        router.patch(
            `/admin/applications/${app.id}`,
            { status: action, notes: form.notes || null, rejected_reason: isRejection ? form.rejected_reason : null } as unknown as Record<string, string | null>,
            { preserveScroll: true, onFinish: () => { setSubmitting(false); setForm({ notes: '', rejected_reason: '' }); onClose(); } },
        );
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isRejection ? <XCircle className="h-5 w-5 text-destructive" /> : <CheckCircle2 className="h-5 w-5 text-green-600" />}
                        {isRejection ? 'Reject' : 'Approve'} Application #{app.id}
                    </DialogTitle>
                    <DialogDescription>{app.user?.name ?? 'Applicant'} for {app.pet?.name ?? 'pet'}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div>
                        <label className="text-sm font-medium block mb-1.5">
                            Staff Notes <span className="text-muted-foreground font-normal">(optional — staff only)</span>
                        </label>
                        <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            rows={3}
                            placeholder="Internal notes…"
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        />
                    </div>
                    {isRejection && (
                        <div>
                            <label className="text-sm font-medium block mb-1.5">
                                Rejection Reason <span className="text-destructive">*</span>
                                <span className="text-muted-foreground font-normal ml-1">(shown to applicant)</span>
                            </label>
                            <textarea
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                                rows={4}
                                placeholder="Explain why this application is being rejected…"
                                value={form.rejected_reason}
                                onChange={e => setForm(f => ({ ...f, rejected_reason: e.target.value }))}
                                required
                            />
                            {error && <p className="text-sm text-destructive mt-1">{error}</p>}
                        </div>
                    )}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
                        <Button type="submit" disabled={submitting} variant={isRejection ? 'destructive' : 'default'}>
                            {submitting ? 'Saving…' : isRejection ? 'Reject Application' : 'Approve Application'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Visit Dialog (schedule / edit) ──────────────────────────────────────────

interface VisitForm {
    visit_date: string;
    assigned_staff_id: string;
    notes: string;
    status: string;
}

function VisitDialog({
    app, staffList, open, onClose,
}: {
    app: Application | null;
    staffList: StaffMember[];
    open: boolean;
    onClose: () => void;
}) {
    const existing = app?.homeVisit ?? null;
    const isEdit = existing !== null;

    const [form, setForm] = useState<VisitForm>({
        visit_date: existing?.visitDate ?? '',
        assigned_staff_id: existing?.assignedStaffId?.toString() ?? '',
        notes: existing?.notes ?? '',
        status: existing?.status ?? 'scheduled',
    });
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<Partial<VisitForm>>({});

    if (!app) return null;

    const validate = (): boolean => {
        const e: Partial<VisitForm> = {};
        if (!form.visit_date) e.visit_date = 'A date and time is required.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setSubmitting(true);

        const payload = {
            visit_date: form.visit_date,
            assigned_staff_id: form.assigned_staff_id || null,
            notes: form.notes || null,
            ...(isEdit ? { status: form.status } : {}),
        } as unknown as Record<string, string | null>;

        if (isEdit) {
            router.patch(`/admin/visits/${existing!.id}`, payload, {
                preserveScroll: true,
                onFinish: () => { setSubmitting(false); onClose(); },
            });
        } else {
            router.post(`/admin/applications/${app.id}/visit`, payload, {
                preserveScroll: true,
                onFinish: () => { setSubmitting(false); onClose(); },
            });
        }
    };

    const handleCancel = () => {
        if (!existing) return;
        if (!window.confirm('Cancel this home visit? The applicant will not be notified automatically.')) return;
        router.delete(`/admin/visits/${existing.id}`, {
            preserveScroll: true,
            onFinish: onClose,
        });
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CalendarPlus className="h-5 w-5 text-blue-600" />
                        {isEdit ? 'Edit Home Visit' : 'Schedule Home Visit'}
                    </DialogTitle>
                    <DialogDescription>
                        {app.user?.name ?? 'Applicant'} for {app.pet?.name ?? 'pet'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Date & time */}
                    <div>
                        <label className="text-sm font-medium block mb-1.5">
                            Visit Date & Time <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.visit_date}
                            onChange={e => setForm(f => ({ ...f, visit_date: e.target.value }))}
                            min={new Date().toISOString().slice(0, 16)}
                        />
                        {errors.visit_date && <p className="text-sm text-destructive mt-1">{errors.visit_date}</p>}
                    </div>

                    {/* Assigned staff */}
                    <div>
                        <label className="text-sm font-medium block mb-1.5">Assigned Staff</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={form.assigned_staff_id}
                            onChange={e => setForm(f => ({ ...f, assigned_staff_id: e.target.value }))}
                        >
                            <option value="">— Unassigned —</option>
                            {staffList.map(s => (
                                <option key={s.id} value={String(s.id)}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Status (edit only) */}
                    {isEdit && (
                        <div>
                            <label className="text-sm font-medium block mb-1.5">Status</label>
                            <select
                                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={form.status}
                                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                            >
                                <option value="scheduled">Scheduled</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="text-sm font-medium block mb-1.5">
                            Notes <span className="text-muted-foreground font-normal">(optional)</span>
                        </label>
                        <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                            rows={3}
                            placeholder="Any instructions or details for the visit…"
                            value={form.notes}
                            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                        />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        {isEdit ? (
                            <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleCancel}>
                                Cancel Visit
                            </Button>
                        ) : <div />}
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>Close</Button>
                            <Button type="submit" disabled={submitting}>
                                {submitting ? 'Saving…' : isEdit ? 'Update Visit' : 'Schedule & Notify'}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminApplications({
    applications,
    staffList,
}: {
    applications: Application[];
    staffList: StaffMember[];
}) {
    const { props } = usePage();
    const flash = (props as unknown as { flash?: { status?: string } }).flash;

    const [updating, setUpdating]   = useState<number | null>(null);
    const [selected, setSelected]   = useState<Application | null>(null);
    const [review, setReview]       = useState<{ app: Application; action: ReviewAction } | null>(null);
    const [visitApp, setVisitApp]   = useState<Application | null>(null);

    const quickStatus = (id: number, status: string) => {
        setUpdating(id);
        router.patch(
            `/admin/applications/${id}`,
            { status } as unknown as Record<string, string>,
            { preserveScroll: true, onFinish: () => setUpdating(null) },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin – Applications" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-7xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-serif flex items-center gap-3">
                                <FileText className="h-8 w-8" />
                                Applications
                            </h1>
                            <p className="text-muted-foreground mt-1">{applications.length} total</p>
                        </div>
                    </div>

                    {flash?.status && (
                        <div className="mb-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 px-4 py-3 text-sm text-green-800 dark:text-green-300">
                            {flash.status}
                        </div>
                    )}

                    <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary/40 border-b border-border">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">ID</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Applicant</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Pet</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Visit</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                                            No applications found.
                                        </td>
                                    </tr>
                                ) : (
                                    applications.map((app, i) => {
                                        const visit = app.homeVisit;
                                        const visitCfg = visit ? visitStatusConfig[visit.status] : null;

                                        return (
                                            <tr
                                                key={app.id}
                                                className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                                            >
                                                <td className="px-4 py-3 text-muted-foreground">{app.id}</td>
                                                <td className="px-4 py-3">
                                                    {app.user ? (
                                                        <>
                                                            <p className="font-medium">{app.user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{app.user.email}</p>
                                                        </>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {app.pet ? (
                                                        <>
                                                            <Link href={`/pets/${app.pet.id}`} className="font-medium hover:underline">
                                                                {app.pet.name}
                                                            </Link>
                                                            <p className="text-xs text-muted-foreground">{app.pet.species}</p>
                                                        </>
                                                    ) : <span className="text-muted-foreground">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] ?? ''}`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                {/* Visit column */}
                                                <td className="px-4 py-3">
                                                    {visitCfg && visit ? (
                                                        <div>
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${visitCfg.color}`}>
                                                                <visitCfg.icon className="h-3 w-3" />
                                                                {visit.status}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground mt-0.5">{visit.visitDateFormatted}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{app.createdAt ?? '—'}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs" onClick={() => setSelected(app)}>
                                                            <Eye className="h-3.5 w-3.5" /> View
                                                        </Button>
                                                        {app.documents && app.documents.length > 0 && (
                                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-1.5 py-0.5 rounded bg-secondary">
                                                                <Paperclip className="h-3 w-3" />{app.documents.length}
                                                            </span>
                                                        )}

                                                        {app.status !== 'approved' && (
                                                            <Button size="sm" variant="outline"
                                                                className="text-xs h-7 px-2 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950/30 gap-1"
                                                                disabled={updating === app.id}
                                                                onClick={() => setReview({ app, action: 'approved' })}
                                                            >
                                                                <CheckCircle2 className="h-3 w-3" /> Approve
                                                            </Button>
                                                        )}
                                                        {app.status !== 'rejected' && (
                                                            <Button size="sm" variant="outline"
                                                                className="text-xs h-7 px-2 text-destructive border-destructive/30 hover:bg-destructive/5 gap-1"
                                                                disabled={updating === app.id}
                                                                onClick={() => setReview({ app, action: 'rejected' })}
                                                            >
                                                                <XCircle className="h-3 w-3" /> Reject
                                                            </Button>
                                                        )}
                                                        {app.status !== 'pending' && app.status !== 'approved' && app.status !== 'rejected' && (
                                                            <Button size="sm" variant="outline" className="text-xs h-7 px-2 gap-1"
                                                                disabled={updating === app.id}
                                                                onClick={() => quickStatus(app.id, 'pending')}
                                                            >
                                                                <MessageSquare className="h-3 w-3" /> Pending
                                                            </Button>
                                                        )}

                                                        {/* Visit button */}
                                                        {(!visit || visit.status === 'cancelled') ? (
                                                            <Button size="sm" variant="outline"
                                                                className="text-xs h-7 px-2 text-blue-700 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/30 gap-1"
                                                                onClick={() => setVisitApp(app)}
                                                            >
                                                                <CalendarPlus className="h-3 w-3" /> Schedule Visit
                                                            </Button>
                                                        ) : (
                                                            <Button size="sm" variant="ghost" className="h-7 px-2 gap-1 text-xs"
                                                                onClick={() => setVisitApp(app)}
                                                            >
                                                                <Pencil className="h-3 w-3" /> Edit Visit
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <DetailsDialog app={selected} open={selected !== null} onClose={() => setSelected(null)} />
            <ReviewDialog app={review?.app ?? null} action={review?.action ?? null} open={review !== null} onClose={() => setReview(null)} />
            <VisitDialog app={visitApp} staffList={staffList} open={visitApp !== null} onClose={() => setVisitApp(null)} />
        </AppLayout>
    );
}
