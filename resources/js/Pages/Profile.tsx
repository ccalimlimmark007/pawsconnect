import { Head, Link, usePage } from '@inertiajs/react';
import { Calendar, CheckCircle, Info, Mail, Settings, User } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile',
        href: '/profile',
    },
];

export default function Profile() {
    const props = usePage().props;
    const { auth, status } = props as { 
        auth?: { user?: { 
            name: string; 
            email: string; 
            created_at: string; 
            email_verified_at?: string 
        } }; 
        status?: string;
    };
    
    const [showStatus, setShowStatus] = useState(!!status);

    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setShowStatus(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const user = auth?.user;

    // Debug log
    console.log('Profile Page Props:', { auth, user, status });

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

    // Format the date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="My Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                <div className="mx-auto w-full max-w-3xl space-y-6">
                    {/* Status Message */}
                    {showStatus && status && (
                        <div className={`flex items-center gap-3 rounded-lg border p-4 ${
                            status.includes('No changes') 
                                ? 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200'
                                : 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200'
                        }`}>
                            {status.includes('No changes') ? (
                                <Info className="h-5 w-5" />
                            ) : (
                                <CheckCircle className="h-5 w-5" />
                            )}
                            <p className="font-medium">{status}</p>
                        </div>
                    )}

                    {/* Profile Header */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                    <User className="h-10 w-10" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold">{user.name}</h1>
                                    <p className="text-sm text-muted-foreground">
                                        Member since {formatDate(user.created_at)}
                                    </p>
                                </div>
                            </div>
                            <Link href="/settings/profile">
                                <Button variant="outline" size="sm">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Edit Profile
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Profile Details */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <h2 className="mb-4 text-lg font-semibold">Account Information</h2>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                <Mail className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Email Address</p>
                                    <p className="font-medium">{user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Account Created</p>
                                    <p className="font-medium">{formatDate(user.created_at)}</p>
                                </div>
                            </div>

                            {user.email_verified_at && (
                                <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Email Verified</p>
                                        <p className="font-medium">{formatDate(user.email_verified_at)}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 dark:border-sidebar-border">
                        <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link href="/settings/profile">
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Profile Settings
                                </Button>
                            </Link>
                            <Link href="/settings/password">
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Change Password
                                </Button>
                            </Link>
                            <Link href="/settings/two-factor">
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Two-Factor Authentication
                                </Button>
                            </Link>
                            <Link href="/settings/appearance">
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Appearance Settings
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
