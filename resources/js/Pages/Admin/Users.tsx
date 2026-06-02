import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Users, Pencil, Trash2 } from 'lucide-react';
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
    { title: 'Users', href: '/admin/users' },
];

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: string;
    roleLabel: string;
    createdAt: string;
}

const roleColors: Record<string, string> = {
    admin: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200',
    shelter_staff: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
    adopter: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200',
};

const roleOptions = [
    { value: 'adopter', label: 'Adopter' },
    { value: 'shelter_staff', label: 'Shelter Staff' },
    { value: 'admin', label: 'Administrator' },
];

function ChangeRoleDialog({
    user,
    open,
    onClose,
}: {
    user: AdminUser | null;
    open: boolean;
    onClose: () => void;
}) {
    const [role, setRole] = useState(user?.role ?? 'adopter');
    const [submitting, setSubmitting] = useState(false);

    if (!user) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (role === user.role) { onClose(); return; }
        setSubmitting(true);
        router.patch(
            `/admin/users/${user.id}/role`,
            { role } as unknown as Record<string, string>,
            {
                preserveScroll: true,
                onFinish: () => { setSubmitting(false); onClose(); },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Change Role</DialogTitle>
                    <DialogDescription>
                        {user.name} · {user.email}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div>
                        <label className="text-sm font-medium block mb-1.5">New Role</label>
                        <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            {roleOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground mt-1.5">
                            Current role:{' '}
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${roleColors[user.role] ?? ''}`}>
                                {user.roleLabel}
                            </span>
                        </p>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || role === user.role}>
                            {submitting ? 'Saving…' : 'Save Role'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsers({ users }: { users: AdminUser[] }) {
    const { props } = usePage();
    const flash = (props as unknown as { flash?: { status?: string } }).flash;
    const authUserId = (props as unknown as { auth?: { user?: { id?: number } } }).auth?.user?.id;

    const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);

    const openRoleDialog = (user: AdminUser) => {
        setRoleTarget(user);
    };

    const deleteUser = (user: AdminUser) => {
        if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;
        router.delete(`/admin/users/${user.id}`, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin – Users" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-8">
                <div className="mx-auto w-full max-w-6xl">
                    <div className="flex items-center gap-4 mb-8">
                        <Link href="/admin">
                            <Button variant="ghost" size="sm" className="gap-2">
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-4xl font-serif flex items-center gap-3">
                                <Users className="h-8 w-8" />
                                Users
                            </h1>
                            <p className="text-muted-foreground mt-1">{users.length} registered users</p>
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
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Name</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Email</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Role</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Joined</th>
                                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                                            No users found.
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user, i) => {
                                        const isSelf = user.id === authUserId;
                                        return (
                                            <tr
                                                key={user.id}
                                                className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-secondary/10'}`}
                                            >
                                                <td className="px-4 py-3 text-muted-foreground">{user.id}</td>
                                                <td className="px-4 py-3 font-medium">{user.name}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] ?? 'bg-gray-100 text-gray-800'}`}
                                                    >
                                                        {user.roleLabel}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">{user.createdAt}</td>
                                                <td className="px-4 py-3">
                                                    {isSelf ? (
                                                        <span className="text-xs text-muted-foreground px-2">You</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 gap-1 text-xs"
                                                                onClick={() => openRoleDialog(user)}
                                                            >
                                                                <Pencil className="h-3.5 w-3.5" /> Role
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-7 px-2 gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                                                                onClick={() => deleteUser(user)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                                            </Button>
                                                        </div>
                                                    )}
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

            <ChangeRoleDialog
                user={roleTarget}
                open={roleTarget !== null}
                onClose={() => setRoleTarget(null)}
            />
        </AppLayout>
    );
}
