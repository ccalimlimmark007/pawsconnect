import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Activity, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Activity Log', href: '/admin/activity' },
];

interface ActivityEntry {
    id: number;
    logName: string;
    description: string;
    event: string | null;
    subjectType: string | null;
    subjectId: number | null;
    subjectLabel: string | null;
    causerName: string;
    causerEmail: string | null;
    properties: Record<string, unknown>;
    createdAt: string;
}

interface PaginationMeta {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
}

interface Props {
    activities: ActivityEntry[];
    pagination: PaginationMeta;
    filters: { subject: string; causer: string };
}

const EVENT_STYLES: Record<string, string> = {
    created: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    updated: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    deleted: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    restored: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const SUBJECT_STYLES: Record<string, string> = {
    Pet: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    AdoptionApplication: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    Shelter: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
    User: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
};

function PropertyChanges({ properties }: { properties: Record<string, unknown> }) {
    const old = properties.old as Record<string, unknown> | undefined;
    const attrs = properties.attributes as Record<string, unknown> | undefined;

    if (!old && !attrs) {
        const entries = Object.entries(properties).filter(([k]) => !['old', 'attributes'].includes(k));
        if (!entries.length) return null;
        return (
            <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                {entries.map(([k, v]) => (
                    <>
                        <dt key={`k-${k}`} className="font-medium">{k}:</dt>
                        <dd key={`v-${k}`}>{String(v)}</dd>
                    </>
                ))}
            </dl>
        );
    }

    const changedKeys = attrs ? Object.keys(attrs) : [];
    if (!changedKeys.length) return null;

    return (
        <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            {changedKeys.map((key) => (
                <>
                    <dt key={`k-${key}`} className="font-medium">{key}:</dt>
                    <dd key={`v-${key}`} className="flex items-center gap-1">
                        {old?.[key] !== undefined && (
                            <span className="line-through opacity-60">{String(old[key])}</span>
                        )}
                        {old?.[key] !== undefined && <span>→</span>}
                        <span>{String(attrs![key])}</span>
                    </dd>
                </>
            ))}
        </dl>
    );
}

export default function ActivityLog({ activities, pagination, filters }: Props) {
    const [subjectFilter, setSubjectFilter] = useState(filters.subject);
    const [causerFilter, setCauserFilter] = useState(filters.causer);

    const applyFilters = (overrides: { subject?: string; causer?: string; page?: number } = {}) => {
        const params: Record<string, string | number> = {};
        const subject = overrides.subject ?? subjectFilter;
        const causer  = overrides.causer  ?? causerFilter;
        const page    = overrides.page    ?? 1;
        if (subject) params.subject = subject;
        if (causer)  params.causer  = causer;
        if (page > 1) params.page   = page;
        router.get('/admin/activity', params, { preserveScroll: false });
    };

    const clearFilters = () => {
        setSubjectFilter('');
        setCauserFilter('');
        router.get('/admin/activity', {});
    };

    const hasFilters = subjectFilter || causerFilter;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Activity Log" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">

                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-serif flex items-center gap-3">
                                <Activity className="h-8 w-8 text-primary" />
                                Activity Log
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Audit trail for all significant actions — {pagination.total} events recorded.
                            </p>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <select
                                value={subjectFilter}
                                onChange={(e) => {
                                    setSubjectFilter(e.target.value);
                                    applyFilters({ subject: e.target.value });
                                }}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm"
                            >
                                <option value="">All Subject Types</option>
                                <option value="Pet">Pets</option>
                                <option value="AdoptionApplication">Applications</option>
                                <option value="Shelter">Shelters</option>
                                <option value="User">Users</option>
                            </select>
                        </div>
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Filter by user name or email…"
                                value={causerFilter}
                                onChange={(e) => setCauserFilter(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-card text-sm"
                            />
                        </div>
                        <Button variant="outline" onClick={() => applyFilters()} size="sm" className="shrink-0">
                            Apply
                        </Button>
                        {hasFilters && (
                            <Button variant="ghost" onClick={clearFilters} size="sm" className="shrink-0 text-muted-foreground">
                                <X className="w-4 h-4 mr-1" /> Clear
                            </Button>
                        )}
                    </div>

                    {/* Log Table */}
                    {activities.length === 0 ? (
                        <div className="text-center py-20 rounded-xl border border-dashed border-border">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No activity recorded yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-xl border border-sidebar-border/70 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted/50 border-b border-border">
                                        <tr>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-40">Time</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-36">Who</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-24">Event</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground w-32">Subject</th>
                                            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description &amp; Changes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {activities.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-muted/30 transition-colors align-top">
                                                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                    <span className="font-mono text-xs">{entry.createdAt}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="font-medium truncate max-w-[130px]">{entry.causerName}</p>
                                                    {entry.causerEmail && (
                                                        <p className="text-xs text-muted-foreground truncate max-w-[130px]">{entry.causerEmail}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {entry.event && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${EVENT_STYLES[entry.event] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                            {entry.event}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {entry.subjectType && (
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_STYLES[entry.subjectType] ?? 'bg-secondary text-secondary-foreground'}`}>
                                                            {entry.subjectType === 'AdoptionApplication' ? 'Application' : entry.subjectType}
                                                        </span>
                                                    )}
                                                    {entry.subjectLabel && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[120px]">{entry.subjectLabel}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p>{entry.description}</p>
                                                    <PropertyChanges properties={entry.properties} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination.last_page > 1 && (
                        <div className="flex items-center justify-between mt-6 text-sm text-muted-foreground">
                            <span>
                                Showing {(pagination.current_page - 1) * pagination.per_page + 1}–
                                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of {pagination.total}
                            </span>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.current_page === 1}
                                    onClick={() => applyFilters({ page: pagination.current_page - 1 })}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.current_page === pagination.last_page}
                                    onClick={() => applyFilters({ page: pagination.current_page + 1 })}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
