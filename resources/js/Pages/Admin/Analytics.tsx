import { Head, router } from '@inertiajs/react';
import {
    BarChart,
    Bar,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    LineChart,
    Line,
    Legend,
} from 'recharts';
import { BarChart2, CheckCircle, Clock, PawPrint, Users } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Admin', href: '/admin' },
    { title: 'Analytics', href: '/admin/analytics' },
];

// ── colour palettes ───────────────────────────────────────────────────────
const SPECIES_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#06b6d4', '#eab308', '#ef4444'];

const STATUS_COLORS: Record<string, string> = {
    started: '#94a3b8',
    pending: '#eab308',
    approved: '#22c55e',
    rejected: '#ef4444',
};

// ── types ─────────────────────────────────────────────────────────────────
interface SpeciesData { species: string; count: number }
interface StatusData  { status: string;  count: number }
interface ShelterData { name: string;    count: number }
interface RegData     { date: string;    count: number }

interface Props {
    petsBySpecies:        SpeciesData[];
    applicationsByStatus: StatusData[];
    approvalRate:         number | null;
    avgDaysToDecision:    number | null;
    topShelters:          ShelterData[];
    registrations:        RegData[];
    activeApplications:   number;
    totalDecided:         number;
    totalPets:            number;
    filters:              { from: string; to: string };
}

// ── date helpers ──────────────────────────────────────────────────────────
function today(): string {
    return new Date().toISOString().slice(0, 10);
}
function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10);
}

const PRESETS = [
    { label: '7d',  days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: '1y',  days: 365 },
    { label: 'All', days: null },
] as const;

// ── small helpers ─────────────────────────────────────────────────────────
function kpiLabel(value: number | null, suffix = ''): string {
    if (value === null) return '—';
    return `${value}${suffix}`;
}

function activePreset(from: string, to: string): number | null | undefined {
    if (!from && !to) return null; // "All"
    const diffDays = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
    const match = PRESETS.find((p) => p.days !== null && Math.abs((p.days ?? 0) - diffDays) <= 1);
    return match?.days ?? undefined; // undefined = custom
}

// ── component ─────────────────────────────────────────────────────────────
export default function Analytics({
    petsBySpecies,
    applicationsByStatus,
    approvalRate,
    avgDaysToDecision,
    topShelters,
    registrations,
    activeApplications,
    totalDecided,
    totalPets,
    filters,
}: Props) {
    const [customFrom, setCustomFrom] = useState(filters.from);
    const [customTo, setCustomTo]     = useState(filters.to);

    const currentActive = activePreset(filters.from, filters.to);

    function applyFilter(from: string, to: string) {
        const params: Record<string, string> = {};
        if (from) params.from = from;
        if (to)   params.to   = to;
        router.get('/admin/analytics', params, { preserveState: false, replace: true });
    }

    function handlePreset(days: number | null) {
        if (days === null) {
            setCustomFrom('');
            setCustomTo('');
            applyFilter('', '');
        } else {
            const f = daysAgo(days);
            const t = today();
            setCustomFrom(f);
            setCustomTo(t);
            applyFilter(f, t);
        }
    }

    function handleCustomApply() {
        applyFilter(customFrom, customTo);
    }

    // ── KPI cards ─────────────────────────────────────────────────────────
    const kpis = [
        {
            label: 'Active Applications',
            value: activeApplications.toString(),
            sub: 'started or pending',
            icon: BarChart2,
            color: 'text-orange-500',
        },
        {
            label: 'Approval Rate',
            value: kpiLabel(approvalRate, '%'),
            sub: `${totalDecided} decided`,
            icon: CheckCircle,
            color: 'text-green-500',
        },
        {
            label: 'Avg Days to Decision',
            value: kpiLabel(avgDaysToDecision, 'd'),
            sub: 'from submission to review',
            icon: Clock,
            color: 'text-blue-500',
        },
        {
            label: 'Pets Listed',
            value: totalPets.toString(),
            sub: 'in selected period',
            icon: PawPrint,
            color: 'text-purple-500',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Analytics" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-7xl space-y-8">

                    {/* ── Header ────────────────────────────────────────── */}
                    <div>
                        <h1 className="font-serif text-4xl">Analytics</h1>
                        <p className="mt-2 text-muted-foreground">Platform-wide metrics for PawsConnect</p>
                    </div>

                    {/* ── Date range filter ─────────────────────────────── */}
                    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-sidebar-border/70 bg-card p-4">
                        <div className="flex items-center gap-2">
                            {PRESETS.map((p) => {
                                const isActive = p.days === currentActive;
                                return (
                                    <Button
                                        key={p.label}
                                        size="sm"
                                        variant={isActive ? 'default' : 'outline'}
                                        onClick={() => handlePreset(p.days ?? null)}
                                    >
                                        {p.label}
                                    </Button>
                                );
                            })}
                        </div>

                        <div className="ml-auto flex items-end gap-2">
                            <div className="grid gap-1">
                                <Label className="text-xs">From</Label>
                                <Input
                                    type="date"
                                    className="h-8 w-36 text-sm"
                                    value={customFrom}
                                    onChange={(e) => setCustomFrom(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1">
                                <Label className="text-xs">To</Label>
                                <Input
                                    type="date"
                                    className="h-8 w-36 text-sm"
                                    value={customTo}
                                    onChange={(e) => setCustomTo(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={handleCustomApply}>Apply</Button>
                        </div>
                    </div>

                    {/* ── KPI cards ─────────────────────────────────────── */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        {kpis.map(({ label, value, sub, icon: Icon, color }) => (
                            <div
                                key={label}
                                className="rounded-xl border border-sidebar-border/70 bg-card p-6"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">{label}</span>
                                    <Icon className={`h-5 w-5 ${color}`} />
                                </div>
                                <p className="text-3xl font-bold">{value}</p>
                                <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* ── Row 1: Pets by species + Application status ───── */}
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

                        {/* Pets by species */}
                        <ChartCard title="Pets Listed by Species" icon={<PawPrint className="h-4 w-4 text-muted-foreground" />}>
                            {petsBySpecies.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <PieChart>
                                        <Pie
                                            data={petsBySpecies}
                                            dataKey="count"
                                            nameKey="species"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={90}
                                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                            label={(entry: any) =>
                                                `${entry.species ?? ''} ${((entry.percent ?? 0) * 100).toFixed(0)}%`
                                            }
                                            labelLine={false}
                                        >
                                            {petsBySpecies.map((_, i) => (
                                                <Cell key={i} fill={SPECIES_COLORS[i % SPECIES_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => [v, 'Pets']} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>

                        {/* Application status breakdown */}
                        <ChartCard title="Applications by Status" icon={<BarChart2 className="h-4 w-4 text-muted-foreground" />}>
                            {applicationsByStatus.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <ResponsiveContainer width="100%" height={260}>
                                    <BarChart
                                        data={applicationsByStatus}
                                        layout="vertical"
                                        margin={{ left: 8, right: 24 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                        <YAxis
                                            type="category"
                                            dataKey="status"
                                            width={72}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip formatter={(v) => [v, 'Applications']} />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Applications">
                                            {applicationsByStatus.map((entry, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* ── Row 2: Registrations over time ────────────────── */}
                    <ChartCard title="New User Registrations Over Time" icon={<Users className="h-4 w-4 text-muted-foreground" />}>
                        {registrations.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <ResponsiveContainer width="100%" height={280}>
                                <LineChart data={registrations} margin={{ left: 0, right: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 11 }}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <Tooltip />
                                    <Line
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={registrations.length <= 30}
                                        name="Registrations"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                    {/* ── Row 3: Top shelters ───────────────────────────── */}
                    <ChartCard title="Top Shelters by Successful Adoptions" icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}>
                        {topShelters.length === 0 ? (
                            <EmptyState message="No approved adoptions in this period." />
                        ) : (
                            <ResponsiveContainer width="100%" height={Math.max(180, topShelters.length * 52)}>
                                <BarChart
                                    data={topShelters}
                                    layout="vertical"
                                    margin={{ left: 8, right: 32 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={140}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip formatter={(v) => [v, 'Adoptions']} />
                                    <Bar dataKey="count" fill="#a855f7" radius={[0, 4, 4, 0]} name="Adoptions" />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </ChartCard>

                </div>
            </div>
        </AppLayout>
    );
}

// ── sub-components ────────────────────────────────────────────────────────
function ChartCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-sidebar-border/70 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
                {icon}
                <h2 className="text-sm font-semibold">{title}</h2>
            </div>
            {children}
        </div>
    );
}

function EmptyState({ message = 'No data for the selected period.' }: { message?: string }) {
    return (
        <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {message}
        </div>
    );
}
