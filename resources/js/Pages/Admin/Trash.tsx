import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Trash2, RotateCcw, X, PawPrint, Building2, FileText } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Trash', href: '/admin/trash' },
];

interface TrashedPet {
    id: number;
    name: string;
    species: string;
    shelterName: string | null;
    deletedAt: string;
}

interface TrashedShelter {
    id: number;
    name: string;
    deletedAt: string;
}

interface TrashedApplication {
    id: number;
    status: string;
    userName: string | null;
    petName: string | null;
    deletedAt: string;
}

interface Trashed {
    pets: TrashedPet[];
    shelters: TrashedShelter[];
    applications: TrashedApplication[];
}

type Tab = 'pets' | 'shelters' | 'applications';

const tabConfig: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'pets', label: 'Pets', icon: PawPrint },
    { key: 'shelters', label: 'Shelters', icon: Building2 },
    { key: 'applications', label: 'Applications', icon: FileText },
];

export default function AdminTrash({ trashed }: { trashed: Trashed }) {
    const { props } = usePage();
    const status = (props as { status?: string }).status;

    const [activeTab, setActiveTab] = useState<Tab>('pets');
    const [processing, setProcessing] = useState<string | null>(null);

    const handleRestore = (type: string, id: number) => {
        setProcessing(`restore-${type}-${id}`);
        router.patch(
            `/admin/trash/${type}/${id}/restore`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(null),
            },
        );
    };

    const handleForceDelete = (type: string, id: number, label: string) => {
        if (!window.confirm(`Permanently delete "${label}"? This cannot be undone.`)) return;
        setProcessing(`delete-${type}-${id}`);
        router.delete(`/admin/trash/${type}/${id}`, {
            preserveScroll: true,
            onFinish: () => setProcessing(null),
        });
    };

    const totalTrashed =
        trashed.pets.length + trashed.shelters.length + trashed.applications.length;

    const RowActions = ({
        type,
        id,
        label,
    }: {
        type: string;
        id: number;
        label: string;
    }) => (
        <div className="flex items-center gap-2">
            <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-700 dark:hover:bg-green-950"
                disabled={!!processing}
                onClick={() => handleRestore(type, id)}
            >
                <RotateCcw className="h-3.5 w-3.5" />
                Restore
            </Button>
            <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
                disabled={!!processing}
                onClick={() => handleForceDelete(type, id, label)}
            >
                <X className="h-3.5 w-3.5" />
                Delete Forever
            </Button>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin – Trash" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-serif flex items-center gap-3">
                                <Trash2 className="h-8 w-8 text-red-600" />
                                Trash
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {totalTrashed} soft-deleted record{totalTrashed !== 1 ? 's' : ''}
                            </p>
                        </div>
                    </div>

                    {/* Status flash */}
                    {status && (
                        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                            {status}
                        </div>
                    )}

                    {totalTrashed === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-sidebar-border/70 bg-card">
                            <Trash2 className="h-16 w-16 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-semibold mb-1">Trash is empty</h3>
                            <p className="text-muted-foreground">All deleted records have been handled.</p>
                        </div>
                    ) : (
                        <>
                            {/* Tabs */}
                            <div className="flex gap-1 mb-6 border-b border-border">
                                {tabConfig.map(({ key, label, icon: Icon }) => {
                                    const count = trashed[key].length;
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => setActiveTab(key)}
                                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                                                activeTab === key
                                                    ? 'border-primary text-primary'
                                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                            {label}
                                            {count > 0 && (
                                                <span className="ml-1 rounded-full bg-destructive/20 text-destructive px-1.5 py-0.5 text-xs font-semibold">
                                                    {count}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Pets Tab */}
                            {activeTab === 'pets' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/40 border-b border-border">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Species</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Shelter</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Deleted</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trashed.pets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                                        No deleted pets.
                                                    </td>
                                                </tr>
                                            ) : (
                                                trashed.pets.map((pet, i) => (
                                                    <tr key={pet.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                                                        <td className="px-4 py-3 font-medium">{pet.name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{pet.species}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{pet.shelterName ?? '—'}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{pet.deletedAt}</td>
                                                        <td className="px-4 py-3">
                                                            <RowActions type="pet" id={pet.id} label={pet.name} />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Shelters Tab */}
                            {activeTab === 'shelters' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/40 border-b border-border">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Deleted</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trashed.shelters.length === 0 ? (
                                                <tr>
                                                    <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                                                        No deleted shelters.
                                                    </td>
                                                </tr>
                                            ) : (
                                                trashed.shelters.map((shelter, i) => (
                                                    <tr key={shelter.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                                                        <td className="px-4 py-3 font-medium">{shelter.name}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{shelter.deletedAt}</td>
                                                        <td className="px-4 py-3">
                                                            <RowActions type="shelter" id={shelter.id} label={shelter.name} />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Applications Tab */}
                            {activeTab === 'applications' && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-card overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-secondary/40 border-b border-border">
                                            <tr>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Applicant</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Pet</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Deleted</th>
                                                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trashed.applications.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                                                        No deleted applications.
                                                    </td>
                                                </tr>
                                            ) : (
                                                trashed.applications.map((app, i) => (
                                                    <tr key={app.id} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}>
                                                        <td className="px-4 py-3 font-medium">{app.userName ?? '—'}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{app.petName ?? '—'}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{app.status}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{app.deletedAt}</td>
                                                        <td className="px-4 py-3">
                                                            <RowActions
                                                                type="application"
                                                                id={app.id}
                                                                label={`Application #${app.id}`}
                                                            />
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
