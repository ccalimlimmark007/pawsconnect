import { Head, Link } from '@inertiajs/react';
import { Users, PawPrint, Building2, FileText, Trash2, Activity, BarChart2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Dashboard', href: '/admin' },
];

interface Stats {
    totalPets: number;
    totalUsers: number;
    totalShelters: number;
    totalApplications: number;
    trashedPets: number;
    trashedShelters: number;
    trashedApplications: number;
}

export default function AdminDashboard({ stats }: { stats: Stats }) {
    const statCards = [
        { label: 'Total Pets', value: stats.totalPets, icon: PawPrint, color: 'text-blue-600' },
        { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-green-600' },
        { label: 'Shelters', value: stats.totalShelters, icon: Building2, color: 'text-purple-600' },
        { label: 'Applications', value: stats.totalApplications, icon: FileText, color: 'text-orange-600' },
    ];

    const trashedTotal = stats.trashedPets + stats.trashedShelters + stats.trashedApplications;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-4xl font-serif">Admin Dashboard</h1>
                        <p className="text-muted-foreground mt-2">Overview of PawsConnect data</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {statCards.map(({ label, value, icon: Icon, color }) => (
                            <div key={label} className="rounded-xl border border-sidebar-border/70 bg-card p-6">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <p className="text-3xl font-bold">{value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/admin/users">
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <Users className="h-8 w-8 text-green-600 mb-3" />
                                <h3 className="font-semibold text-lg">Manage Users</h3>
                                <p className="text-sm text-muted-foreground mt-1">{stats.totalUsers} registered users</p>
                            </div>
                        </Link>

                        <Link href="/admin/applications">
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <FileText className="h-8 w-8 text-orange-600 mb-3" />
                                <h3 className="font-semibold text-lg">Applications</h3>
                                <p className="text-sm text-muted-foreground mt-1">{stats.totalApplications} total applications</p>
                            </div>
                        </Link>

                        <Link href="/admin/trash">
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <Trash2 className="h-8 w-8 text-red-600 mb-3" />
                                <h3 className="font-semibold text-lg">Trash</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {trashedTotal} deleted record{trashedTotal !== 1 ? 's' : ''} awaiting action
                                </p>
                            </div>
                        </Link>

                        <Link href="/admin/activity">
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <Activity className="h-8 w-8 text-sky-600 mb-3" />
                                <h3 className="font-semibold text-lg">Activity Log</h3>
                                <p className="text-sm text-muted-foreground mt-1">Audit trail of all significant actions</p>
                            </div>
                        </Link>

                        <Link href="/admin/analytics">
                            <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 hover:bg-secondary/30 transition-colors cursor-pointer">
                                <BarChart2 className="h-8 w-8 text-indigo-600 mb-3" />
                                <h3 className="font-semibold text-lg">Analytics</h3>
                                <p className="text-sm text-muted-foreground mt-1">Metrics, charts &amp; adoption trends</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
